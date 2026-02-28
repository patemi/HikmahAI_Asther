import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { verifyApiToken } from "@/lib/auth";
import {
  chatCompletionStream,
  analyzeImage,
  MODELS,
} from "@/lib/openai";
import { retrieveKnowledge, buildKnowledgeContext } from "@/lib/rag";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// Request schema
const chatRequestSchema = z.object({
  participantId: z.string(),
  message: z.string(),
  userName: z.string().optional(),
  userId: z.string().optional(),
  imageUrl: z.string().optional(),
  saveHistory: z.boolean().optional().default(true),
});

function getUserIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const userId = (metadata as { userId?: unknown }).userId;
  return typeof userId === "string" ? userId : null;
}

function getConversationTitleFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const title = (metadata as { title?: unknown }).title;
  return typeof title === "string" && title.trim() ? title.trim() : null;
}

function buildConversationTitle(text: string): string {
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/[\n\r\t]/g, " ")
    .trim();

  if (!cleaned) return "Percakapan baru";

  const withoutPunctuation = cleaned.replace(/[!?.,;:]+$/g, "").trim();
  const words = withoutPunctuation.split(" ").filter(Boolean);
  const title = words.slice(0, 8).join(" ");

  return title.length > 52 ? `${title.slice(0, 52).trim()}…` : title;
}

// Verify bearer token
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7);
  return verifyApiToken(token);
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const isValid = await verifyAuth(request);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { participantId, message, userName, userId, imageUrl, saveHistory } = parsed.data;

    // Get or create participant (only if saving history)
    let participant = null;
    if (saveHistory) {
      participant = await db.query.chatParticipants.findFirst({
        where: eq(schema.chatParticipants.externalId, participantId),
      });

      if (!participant) {
        const title = buildConversationTitle(message);
        const metadata = {
          ...(userId ? { userId } : {}),
          title,
        };

        [participant] = await db
          .insert(schema.chatParticipants)
          .values({
            externalId: participantId,
            name: userName,
            metadata,
          })
          .returning();
      } else if (userId && getUserIdFromMetadata(participant.metadata) !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else if (userName && participant.name !== userName) {
        // Update name if provided and different
        [participant] = await db
          .update(schema.chatParticipants)
          .set({
            name: userName,
            metadata: userId
              ? {
                  ...(participant.metadata && typeof participant.metadata === "object"
                    ? participant.metadata
                    : {}),
                  userId,
                }
              : participant.metadata,
            updatedAt: new Date(),
          })
          .where(eq(schema.chatParticipants.id, participant.id))
          .returning();
      }

      if (participant && !getConversationTitleFromMetadata(participant.metadata)) {
        const baseMetadata =
          participant.metadata && typeof participant.metadata === "object"
            ? participant.metadata
            : {};
        const title = buildConversationTitle(message);

        [participant] = await db
          .update(schema.chatParticipants)
          .set({
            metadata: {
              ...baseMetadata,
              ...(userId ? { userId } : {}),
              title,
            },
            updatedAt: new Date(),
          })
          .where(eq(schema.chatParticipants.id, participant.id))
          .returning();
      }
    }

    // Get app config
    const config = await db.query.appConfig.findFirst();
    const memoryLength = config?.memoryLength || parseInt(process.env.MEMORY_LENGTH || "5");

    // Get conversation history (only if saving history and participant exists)
    let history: Array<{ role: string; content: string }> = [];
    if (saveHistory && participant) {
      const dbHistory = await db.query.chatMessages.findMany({
        where: eq(schema.chatMessages.participantId, participant.id),
        orderBy: [desc(schema.chatMessages.createdAt)],
        limit: memoryLength * 2, // user + assistant pairs
      });
      // Reverse to get chronological order
      history = dbHistory.reverse();
    }

    // Handle image analysis
    let imageAnalysis: string | null = null;
    if (imageUrl) {
      imageAnalysis = await analyzeImage(
        imageUrl,
        "Describe this image in detail. What do you see?",
        config?.imageModel || MODELS.IMAGE
      );
    }

    // Build messages array
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [];

    // System prompt
    let systemPrompt =
      config?.systemPrompt || "You are a helpful assistant.";
    if (config?.botPersonality) {
      systemPrompt = `You are ${config.botName || "Ekabot"}, a ${config.botPersonality} assistant.\n\n${systemPrompt}`;
    }

    // Add user name context if available
    const currentUserName = userName || participant?.name;
    if (currentUserName) {
      systemPrompt += `\n\nThe user's name is ${currentUserName}. Address them by name when appropriate.`;
    }

    systemPrompt += `

Answer style rules (VERY IMPORTANT):
- Always answer in clear Indonesian unless user asks another language.
- Keep responses neat, structured, and easy to scan.
- Use markdown formatting with this default structure when relevant:
  1) **Jawaban Singkat** (1-3 kalimat)
  2) **Penjelasan** (bullet points)
  3) **Kesimpulan** (1 kalimat)
- Use short paragraphs and bullet lists, avoid long dense blocks.
- For dalil/references, mention them naturally according to the flow of the discussion, not as a rigid standalone classification section.
- Only include dalil that are directly relevant to the user's current question.
- If quoting Arabic verse/hadith text, ALWAYS include its Indonesian meaning right after it.
- Keep dalil concise (prioritize 1-2 strongest references unless user asks for detailed expansion).
- For Islamic content, prioritize adab, clarity, and avoid overclaiming certainty.
- If there are differing scholarly opinions, present them fairly and mention this explicitly.
- If unsure, say uncertainty clearly and suggest verifying with trusted ulama/source.
- Avoid decorative symbols spam, excessive emoji, and repetitive wording.
`;

    // RAG: Retrieve relevant knowledge
    if (config?.ragEnabled) {
      console.log("[RAG] RAG is enabled, retrieving knowledge for:", message);
      const topK = config.ragTopK || 5;
      const minScore = (config.ragMinScore || 70) / 100;
      const knowledge = await retrieveKnowledge(message, { topK, minScore });
      console.log(`[RAG] Retrieved ${knowledge.length} knowledge chunks`);
      const context = buildKnowledgeContext(knowledge);

      if (context) {
        console.log("[RAG] Adding knowledge context to system prompt");
        systemPrompt += `\n\n${context}`;
      }
    } else {
      console.log("[RAG] RAG is disabled in config");
    }

    messages.push({ role: "system", content: systemPrompt });

    // Add history (memory)
    console.log(`[Memory] Adding ${history.length} messages from history`);
    for (const msg of history) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    // Add current message
    let userContent = message;
    if (imageAnalysis) {
      userContent = `[User sent an image]\nImage description: ${imageAnalysis}\n\nUser message: ${message}`;
    }
    messages.push({ role: "user", content: userContent });

    // Save user message (only if saving history)
    if (saveHistory && participant) {
      await db.insert(schema.chatMessages).values({
        participantId: participant.id,
        role: "user",
        content: message,
        imageUrl,
        imageAnalysis,
      });
    }

    const selectedTextModel =
      process.env.STRIX_LLM || process.env.LLM_MODEL || config?.textModel || MODELS.TEXT;

    // Create streaming response
    const stream = await chatCompletionStream(messages, {
      model: selectedTextModel,
    });

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    let fullResponse = "";
    let promptTokens = 0;
    let completionTokens = 0;

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            fullResponse += content;

            // Track tokens from final chunk
            if (chunk.usage) {
              promptTokens = chunk.usage.prompt_tokens;
              completionTokens = chunk.usage.completion_tokens;
            }

            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // Save assistant response (only if saving history)
          if (saveHistory && participant) {
            await db.insert(schema.chatMessages).values({
              participantId: participant.id,
              role: "assistant",
              content: fullResponse,
              promptTokens,
              completionTokens,
            });
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
