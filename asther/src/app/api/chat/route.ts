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
  imageUrl: z.string().optional(),
  saveHistory: z.boolean().optional().default(true),
});

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

    const { participantId, message, userName, imageUrl, saveHistory } = parsed.data;

    // Get or create participant (only if saving history)
    let participant = null;
    if (saveHistory) {
      participant = await db.query.chatParticipants.findFirst({
        where: eq(schema.chatParticipants.externalId, participantId),
      });

      if (!participant) {
        [participant] = await db
          .insert(schema.chatParticipants)
          .values({ externalId: participantId, name: userName })
          .returning();
      } else if (userName && participant.name !== userName) {
        // Update name if provided and different
        [participant] = await db
          .update(schema.chatParticipants)
          .set({ name: userName, updatedAt: new Date() })
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

    // Create streaming response
    const stream = await chatCompletionStream(messages, {
      model: config?.textModel || MODELS.TEXT,
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
