import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { verifyApiToken } from "@/lib/auth";
import {
  chatCompletionStream,
  chatCompletion,
  analyzeImage,
  MODELS,
} from "@/lib/openai";
import { getAppConfig } from "@/lib/app-config";
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
  responseDepth: z.enum(["ringkas", "standar", "mendalam"]).optional().default("standar"),
  includeCitations: z.boolean().optional().default(true),
});

const ISLAMIC_QUERY_REGEX = /(islam|fiqh|fikih|aqidah|tauhid|syariah|syariat|halal|haram|sunnah|zakat|shalat|salat|puasa|haji|umrah|nikah|talak|waris|qur'?an|hadits?|hadis|tafsir|ayat|surah|sirah|sejarah\s+islam|nabi|rasul|sahabat|tabiin|tabi'?\s*tabiin|ulama|khalifah|khilafah|khulafa|rasyidin|dinasti\s+umayyah|dinasti\s+abbasiyah|utsmani|ottoman|mamluk|ayyubiyah|fatimiyah|andarus|pahlawan\s+islam|tokoh\s+islam)/i;
const QURAN_QUERY_REGEX = /(qur'?an|al[-\s]?qur'?an|alqur'?an|tafsir|ayat|surah|\bqs\b)/i;
const CLEARLY_NON_ISLAMIC_REGEX = /(javascript|typescript|next\.?js|react|node\.?js|python|java\b|golang|pemrograman|koding|coding|debug|bug|saham|crypto|bitcoin|trading|forex|sepak\s?bola|football|basket|anime|film|drama|musik\s+pop|marketing|iklan|seo|jualan\s+online|casino|judi|slot|zodiak)/i;
const ISLAMIC_CONTEXT_EXTRA_REGEX = /(sya'?i|sa'i|sai\b|thawaf|tawaf|ihram|miqat|wukuf|jamrah|talbiyah|rukun\s+haji|rukun\s+umrah|umrah|haji\s+tamattu|haji\s+qiran|haji\s+ifrad|fatwa|ustadz|ustaz|kyai|kiai|dalil|ijma|qiyas|mazhab|madzhab|ibadah|muamalah|adab|akhlak|syar'?i)/i;
const FOLLOW_UP_REFERENCE_REGEX = /(itu|tersebut|yang\s+tadi|yang\s+sebelumnya|kasus\s+itu|kondisi\s+itu|dalam\s+kondisi\s+itu|kalau\s+begitu|jika\s+begitu|berarti|lalu|terus|lanjut)/i;
const CONTEXT_STOPWORDS = new Set([
  "yang",
  "dan",
  "atau",
  "di",
  "ke",
  "dari",
  "untuk",
  "dengan",
  "pada",
  "itu",
  "ini",
  "saya",
  "anda",
  "kamu",
  "kami",
  "kita",
  "mereka",
  "adalah",
  "akan",
  "jika",
  "kalau",
  "bagaimana",
  "apakah",
  "seperti",
  "dalam",
  "namun",
  "tetap",
  "sambil",
  "lalu",
  "terus",
]);

type TopicClassificationResult = {
  allowed: boolean;
  reason: string;
};

function hasIslamicSignal(text: string) {
  return (
    ISLAMIC_QUERY_REGEX.test(text) ||
    QURAN_QUERY_REGEX.test(text) ||
    ISLAMIC_CONTEXT_EXTRA_REGEX.test(text)
  );
}

function toMeaningfulTokens(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !CONTEXT_STOPWORDS.has(token));
}

function countSharedContextTerms(
  message: string,
  history: Array<{ role: string; content: string }>
) {
  const messageTerms = new Set(toMeaningfulTokens(message));

  if (messageTerms.size === 0) return 0;

  const historyTerms = new Set(
    toMeaningfulTokens(history.map((item) => item.content).join(" "))
  );

  let shared = 0;
  for (const term of messageTerms) {
    if (historyTerms.has(term)) {
      shared += 1;
    }
  }

  return shared;
}

function isIslamicFollowUpFromHistory(
  message: string,
  history: Array<{ role: string; content: string }>
) {
  const recentHistory = history.slice(-6);
  if (recentHistory.length === 0) return false;

  const hasIslamicHistory = recentHistory.some((item) =>
    hasIslamicSignal(item.content)
  );

  if (!hasIslamicHistory) return false;

  const sharedTerms = countSharedContextTerms(message, recentHistory);
  const hasReferenceCue = FOLLOW_UP_REFERENCE_REGEX.test(message.toLowerCase());

  return sharedTerms >= 2 || (hasReferenceCue && sharedTerms >= 1);
}

function buildIslamicOnlyNotice() {
  return [
    "Maaf, saya hanya melayani topik keislaman.",
    "",
    "Topik yang dapat saya bantu:",
    "- Hukum Islam (fiqh, ibadah, muamalah, adab, akhlak)",
    "- Sejarah Islam (nabi, sahabat, ulama, khalifah, kerajaan/peradaban Islam, tokoh/pahlawan Islam)",
    "- Pengetahuan umum Islam (aqidah, Al-Qur'an, hadits, tafsir, sirah)",
    "",
    "Silakan kirim ulang pertanyaan dalam ruang lingkup keislaman.",
  ].join("\n");
}

function parseClassificationJson(raw: string): TopicClassificationResult | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] || trimmed).trim();
  const objectMatch = candidate.match(/\{[\s\S]*\}/);

  if (!objectMatch) return null;

  try {
    const parsed = JSON.parse(objectMatch[0]) as {
      allowed?: unknown;
      reason?: unknown;
    };

    return {
      allowed: parsed.allowed === true,
      reason:
        typeof parsed.reason === "string" && parsed.reason.trim()
          ? parsed.reason.trim()
          : "Topik tidak termasuk ruang lingkup keislaman.",
    };
  } catch {
    return null;
  }
}

async function classifyIslamicTopicStrict(params: {
  message: string;
  history: Array<{ role: string; content: string }>;
  preferredModel?: string;
  hasKbMatch?: boolean;
}): Promise<TopicClassificationResult> {
  const { message, history, preferredModel, hasKbMatch } = params;
  const normalizedMessage = message.trim();

  if (!normalizedMessage) {
    return {
      allowed: false,
      reason: "Pesan kosong tidak bisa diklasifikasikan.",
    };
  }

  if (hasKbMatch) {
    return {
      allowed: true,
      reason: "Pertanyaan relevan dengan konten knowledge base.",
    };
  }

  if (hasIslamicSignal(normalizedMessage)) {
    return {
      allowed: true,
      reason: "Terdeteksi kata kunci keislaman.",
    };
  }

  if (CLEARLY_NON_ISLAMIC_REGEX.test(normalizedMessage)) {
    return {
      allowed: false,
      reason: "Terdeteksi topik non-keislaman.",
    };
  }

  if (isIslamicFollowUpFromHistory(normalizedMessage, history)) {
    return {
      allowed: true,
      reason: "Follow-up masih berada dalam konteks keislaman dari riwayat percakapan.",
    };
  }

  const clippedHistory = history
    .slice(-6)
    .map((item) => `${item.role}: ${item.content.slice(0, 500)}`)
    .join("\n");

  const classifierMessages: Array<{ role: "system" | "user"; content: string }> = [
    {
      role: "system",
      content: `Anda adalah classifier topik yang SANGAT ketat.

Klasifikasikan apakah pesan user TERMASUK topik yang diizinkan berikut:
1) Hukum Islam (fiqh, ibadah, muamalah, akhlak, adab)
2) Sejarah Islam (para nabi/rasul, sahabat, ulama, khalifah, kerajaan/peradaban Islam, tokoh/pahlawan Islam)
3) Pengetahuan umum Islam (aqidah, Al-Qur'an, hadits, tafsir, sirah)

Semua topik di luar ruang lingkup di atas harus ditandai TIDAK DIIZINKAN.
Jika pesan berupa follow-up singkat, gunakan riwayat untuk menentukan konteks.

Output HARUS JSON valid saja tanpa teks lain, format:
{"allowed": true|false, "reason": "..."}`,
    },
    {
      role: "user",
      content: `Riwayat (bisa kosong):\n${clippedHistory || "(kosong)"}\n\nPesan saat ini:\n${normalizedMessage}`,
    },
  ];

  const modelCandidates = [
    preferredModel,
    "gpt-4.1-nano",
    "gpt-4.1-mini",
    "gpt-4o-mini",
  ].filter((model, index, arr): model is string => Boolean(model) && arr.indexOf(model) === index);

  for (const model of modelCandidates) {
    try {
      const completion = await chatCompletion(classifierMessages, {
        model,
        temperature: 0,
        maxTokens: 160,
      });

      const content = completion.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        continue;
      }

      const parsed = parseClassificationJson(content);
      if (parsed) {
        return parsed;
      }
    } catch (error) {
      console.warn(`[TopicGuard] classification failed model=${model}`, error);
    }
  }

  return {
    allowed: false,
    reason: "Topik tidak bisa diverifikasi sebagai topik keislaman.",
  };
}

function createSingleMessageSseResponse(content: string) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

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

    const {
      participantId,
      message,
      userName,
      userId,
      imageUrl,
      saveHistory,
      responseDepth,
      includeCitations,
    } = parsed.data;

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
    const config = await getAppConfig();
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

    let retrievedKnowledge: Awaited<ReturnType<typeof retrieveKnowledge>> = [];
    let hasKbMatch = false;

    if (config?.ragEnabled) {
      const topK = config.ragTopK || 5;
      const minScore = (config.ragMinScore || 70) / 100;
      const isQuranFocusedQuery = QURAN_QUERY_REGEX.test(message);
      const expandedTopK = isQuranFocusedQuery ? Math.min(topK + 3, 12) : topK;

      console.log("[RAG] RAG is enabled, retrieving knowledge for:", message);
      retrievedKnowledge = await retrieveKnowledge(message, { topK: expandedTopK, minScore });
      hasKbMatch = retrievedKnowledge.length > 0;

      if (!hasKbMatch) {
        const fallbackTopK = Math.min(expandedTopK + 4, 14);
        const fallbackMinScore = Math.max(minScore - 0.35, 0.2);
        console.log(
          `[RAG] Primary retrieval empty, fallback retrieval with topK=${fallbackTopK}, minScore=${fallbackMinScore}`
        );
        retrievedKnowledge = await retrieveKnowledge(message, {
          topK: fallbackTopK,
          minScore: fallbackMinScore,
        });
      }

      console.log(`[RAG] Retrieved ${retrievedKnowledge.length} knowledge chunks`);
    }

    const topicClassification = await classifyIslamicTopicStrict({
      message,
      history,
      preferredModel: config?.textModel || MODELS.TEXT,
      hasKbMatch,
    });

    if (!topicClassification.allowed) {
      const notice = buildIslamicOnlyNotice();

      if (saveHistory && participant) {
        await db.insert(schema.chatMessages).values({
          participantId: participant.id,
          role: "user",
          content: message,
          imageUrl,
        });

        await db.insert(schema.chatMessages).values({
          participantId: participant.id,
          role: "assistant",
          content: notice,
        });
      }

      return createSingleMessageSseResponse(notice);
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

    if (responseDepth === "ringkas") {
      systemPrompt += `

Depth mode: ringkas
- Prioritize short answers.
- Keep explanation minimal unless user explicitly asks details.
- Default target: 3-6 lines total.
`;
    } else if (responseDepth === "mendalam") {
      systemPrompt += `

Depth mode: mendalam
- Give deeper and more complete reasoning.
- Include nuanced differences of opinion when relevant.
- Structure with concise headings and bullet points when useful.
`;
    }

    const guardrailLevel = config?.guardrailLevel === "ketat" ? "ketat" : "standar";

    if (guardrailLevel === "ketat") {
      systemPrompt += `

Guardrail mode: ketat
- Be extra careful with certainty claims.
- Explicitly separate established facts vs interpretation.
- For fiqh-sensitive answers, suggest validation with trusted ulama/local authority before acting.
`;
    }

    // RAG: Build context from already-retrieved knowledge (retrieval happened before topic classification)
    if (config?.ragEnabled) {
      const context = buildKnowledgeContext(retrievedKnowledge);

      if (context) {
        console.log("[RAG] Adding knowledge context to system prompt");
        systemPrompt += `\n\n${context}`;

        if (includeCitations) {
          systemPrompt += `

If knowledge context is used, optionally reference source numbers inline like [1], [2] for transparency.`;
        }
      }
    } else {
      console.log("[RAG] RAG is disabled in config");
    }

    const strictCitationMode = config?.citationStrict === true;
    const isIslamicQuery = ISLAMIC_QUERY_REGEX.test(message);

    if (strictCitationMode && includeCitations && isIslamicQuery && retrievedKnowledge.length === 0) {
      const encoder = new TextEncoder();
      const fallbackStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                content:
                  "Maaf, saya belum menemukan sumber rujukan yang memadai di knowledge base untuk menjawab pertanyaan ini secara aman. Silakan tambahkan dokumen rujukan yang relevan (misalnya ayat/tafsir/hadits) atau nonaktifkan strict citation mode di dashboard admin.",
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(fallbackStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
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

    let stream: Awaited<ReturnType<typeof chatCompletionStream>>;
    const modelCandidates = [
      selectedTextModel,
      config?.textModel,
      "gpt-4.1-mini",
      "gpt-4o-mini",
    ].filter((model, index, arr): model is string => Boolean(model) && arr.indexOf(model) === index);

    let lastModelError: unknown = null;

    try {
      let resolvedStream: Awaited<ReturnType<typeof chatCompletionStream>> | null = null;

      for (const model of modelCandidates) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            resolvedStream = await chatCompletionStream(messages, { model });
            break;
          } catch (error) {
            lastModelError = error;
            console.warn(`[Model] stream init failed model=${model} attempt=${attempt}`, error);

            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 600));
            }
          }
        }

        if (resolvedStream) {
          break;
        }
      }

      if (!resolvedStream) {
        throw lastModelError || new Error("No available model");
      }

      stream = resolvedStream;
    } catch (modelError) {
      console.error("Model stream init error:", modelError);

      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          if (includeCitations) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "citations",
                  citations: retrievedKnowledge.slice(0, 5).map((chunk) => ({
                    title: chunk.documentTitle,
                    source: chunk.source ?? null,
                    score: chunk.similarity,
                  })),
                  notice:
                    retrievedKnowledge.length === 0
                      ? "Belum ada sumber relevan yang lolos retrieval untuk pertanyaan ini."
                      : undefined,
                })}\n\n`
              )
            );
          }

          let fallbackContent = "";

          for (const model of modelCandidates) {
            try {
              const completion = await chatCompletion(messages, { model });
              const content = completion.choices?.[0]?.message?.content;
              if (typeof content === "string" && content.trim()) {
                fallbackContent = content;
                break;
              }
            } catch (error) {
              console.warn(`[Model] non-stream fallback failed model=${model}`, error);
            }
          }

          if (!fallbackContent) {
            fallbackContent =
              "Maaf, layanan model sedang sibuk/terganggu sementara. Saya sudah mencoba beberapa model cadangan namun belum berhasil. Silakan coba lagi beberapa saat lagi.";
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: fallbackContent })}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    let fullResponse = "";
    let promptTokens = 0;
    let completionTokens = 0;
    const citationPayload = includeCitations
      ? retrievedKnowledge.slice(0, 5).map((chunk) => ({
          title: chunk.documentTitle,
          source: chunk.source ?? null,
          score: chunk.similarity,
        }))
      : [];
    const citationNotice =
      includeCitations && citationPayload.length === 0
        ? "Belum ada sumber relevan yang lolos retrieval untuk pertanyaan ini."
        : undefined;

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          if (includeCitations) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "citations",
                  citations: citationPayload,
                  notice: citationNotice,
                })}\n\n`
              )
            );
          }

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

          if (!fullResponse.trim()) {
            try {
              const completion = await chatCompletion(messages, {
                model: selectedTextModel,
              });
              const fallbackContent = completion.choices?.[0]?.message?.content;
              if (typeof fallbackContent === "string" && fallbackContent.trim()) {
                fullResponse = fallbackContent;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content: fallbackContent })}\n\n`)
                );
              }
            } catch (nonStreamError) {
              console.error("Non-stream fallback error:", nonStreamError);
            }
          }

          if (!fullResponse.trim()) {
            const emptyResponseNotice =
              "Maaf, provider model mengembalikan respons kosong. Periksa BASE_URL/model API Anda atau coba lagi beberapa saat.";
            fullResponse = emptyResponseNotice;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: emptyResponseNotice })}\n\n`)
            );
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
