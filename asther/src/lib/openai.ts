import { db, schema } from "@/lib/db";
import { consumeIndexBudget, consumeModelBudget } from "@/lib/limits";
import { HttpError } from "@/lib/http";
import OpenAI from "openai";
import { getAppConfig } from "@/lib/app-config";
import { EMBEDDING_DIMENSIONS } from "@/lib/db/schema";

// ─── Google Gemini Fallback Chains ───────────────────────────

export const GEMINI_CHAT_FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

export const GEMINI_EMBEDDING_FALLBACK_MODELS = [
  "gemini-embedding-2",
  "gemini-embedding-001",
] as const;

export function isGeminiModel(modelName?: string | null): boolean {
  if (!modelName) return false;
  const lower = modelName.toLowerCase();
  return lower.startsWith("gemini-") || lower.includes("gemini");
}

/**
 * Return an ordered list of chat model candidates with sequential fallback.
 * If preferredModel is specified, it will be first, followed by the remaining
 * Gemini models in order (3.8 Flash -> 3.6 Flash -> 3.5 Flash Lite -> 3.1 Flash Lite).
 */
export function getChatModelFallbackList(
  preferredModel?: string | null,
): string[] {
  const result: string[] = [];

  const add = (m: string | undefined | null) => {
    if (m && typeof m === "string") {
      const trimmed = m.trim();
      if (trimmed && !result.includes(trimmed)) {
        result.push(trimmed);
      }
    }
  };

  add(preferredModel);

  // Gemini sequential fallback chain
  for (const m of GEMINI_CHAT_FALLBACK_MODELS) {
    add(m);
  }

  return result;
}

/**
 * Return an ordered list of embedding model candidates with sequential fallback.
 * (Gemini Embedding 2 -> Gemini Embedding 1 -> text-embedding-3-small)
 */
export function getEmbeddingModelFallbackList(
  preferredModel?: string | null,
): string[] {
  const result: string[] = [];

  const add = (m: string | undefined | null) => {
    if (m && typeof m === "string") {
      const trimmed = m.trim();
      if (trimmed && !result.includes(trimmed)) {
        result.push(trimmed);
      }
    }
  };

  add(preferredModel);

  // Gemini sequential embedding fallback chain
  for (const m of GEMINI_EMBEDDING_FALLBACK_MODELS) {
    add(m);
  }

  // Backup fallback embedding model
  add("text-embedding-3-small");

  return result;
}

// ─── Client Resolution & Caching ─────────────────────────────

interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
}

const clientCache = new Map<string, OpenAI>();

async function resolveClientConfigForModel(
  modelName?: string | null,
): Promise<ResolvedConfig> {
  const config = await getAppConfig();
  const isGemini = isGeminiModel(modelName);

  if (isGemini) {
    const apiKey = (
      process.env.GEMINI_API_KEY ||
      config?.geminiApiKey ||
      (config?.openaiApiKey?.startsWith("AQ.") ||
      config?.openaiApiKey?.startsWith("AIza")
        ? config.openaiApiKey
        : "") ||
      (process.env.OPENAI_API_KEY?.startsWith("AQ.") ||
      process.env.OPENAI_API_KEY?.startsWith("AIza")
        ? process.env.OPENAI_API_KEY
        : "") ||
      process.env.LLM_API_KEY ||
      config?.openaiApiKey ||
      ""
    ).trim();

    const baseUrl = (
      process.env.GEMINI_BASE_URL ||
      "https://generativelanguage.googleapis.com/v1beta/openai/"
    ).trim();

    return { apiKey, baseUrl };
  }

  // Standard OpenAI / custom provider
  const apiKey = (
    process.env.LLM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    config?.openaiApiKey ||
    process.env.GEMINI_API_KEY ||
    ""
  ).trim();

  const baseUrl = (
    process.env.LLM_API_BASE ||
    process.env.BASE_URL ||
    process.env.STRIX_BASE_URL ||
    config?.baseUrl ||
    ""
  ).trim();

  return { apiKey, baseUrl };
}

export async function getClientForModel(
  modelName?: string | null,
): Promise<OpenAI> {
  const { apiKey, baseUrl } = await resolveClientConfigForModel(modelName);
  if (!apiKey) {
    throw new Error(
      `API key is not configured for model "${modelName || "default"}"`,
    );
  }

  const cacheKey = `${apiKey}@@${baseUrl}`;
  let client = clientCache.get(cacheKey);

  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
      maxRetries: 0, // Disable internal SDK delay so our ordered fallback switch happens instantly
      timeout: 30000, // 30s timeout for stable streaming over international connections
    });
    clientCache.set(cacheKey, client);
  }

  return client;
}

// Model defaults
export const MODELS = {
  TEXT: process.env.LLM_MODEL || process.env.STRIX_LLM || "gemini-3.8-flash",
  IMAGE: "gemini-3.6-flash",
  EMBEDDING: process.env.EMBEDDING_MODEL || "gemini-embedding-2",
} as const;

// Use a single configured model so indexing and retrieval share one vector space.

export function isVoyageModel(modelName?: string | null): boolean {
  return !!modelName && modelName.toLowerCase().startsWith("voyage-");
}

// Voyage prepends a different prompt for queries and documents.
export type EmbeddingInputType = "query" | "document";
const VOYAGE_BATCH_SIZE = 128;

function checkEmbedding(embedding: unknown): number[] {
  if (
    !Array.isArray(embedding) ||
    embedding.length !== EMBEDDING_DIMENSIONS ||
    embedding.some((n) => !Number.isFinite(n))
  )
    throw new Error(
      `Embedding must contain exactly ${EMBEDDING_DIMENSIONS} finite values. Use the same model for indexing and retrieval.`,
    );
  return embedding;
}

async function embedWithVoyage(
  texts: string[],
  model: string,
  inputType: EmbeddingInputType,
): Promise<number[][]> {
  const apiKey = (process.env.VOYAGE_API_KEY || "").trim();
  if (!apiKey) throw new Error("VOYAGE_API_KEY is not configured");
  const url =
    (process.env.VOYAGE_BASE_URL || "https://api.voyageai.com/v1").replace(
      /\/+$/,
      "",
    ) + "/embeddings";
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += VOYAGE_BATCH_SIZE) {
    const batch = texts.slice(i, i + VOYAGE_BATCH_SIZE);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: batch,
        model,
        input_type: inputType,
        output_dimension: EMBEDDING_DIMENSIONS,
        truncation: true,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 429)
      throw new HttpError(
        429,
        "Voyage sedang membatasi permintaan (rate limit). " +
          (await response.text()).slice(0, 300),
        Number(response.headers.get("retry-after")) || 20,
      );
    if (!response.ok)
      throw new Error(
        `Voyage embeddings HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`,
      );
    const body = (await response.json()) as {
      data?: Array<{ index: number; embedding: number[] }>;
      usage?: { total_tokens?: number };
    };
    const data = [...(body.data || [])].sort((a, b) => a.index - b.index);
    if (data.length !== batch.length)
      throw new Error("Voyage returned an unexpected number of embeddings.");
    vectors.push(...data.map((item) => checkEmbedding(item.embedding)));
    await recordUsage(model, "embedding", body.usage?.total_tokens || 0, 0);
  }
  return vectors;
}

async function embedWithOpenAI(
  text: string,
  model: string,
  consumeBudget: (tokens: number) => Promise<void>,
) {
  await consumeBudget(text.length);
  const client = await getClientForModel(model);
  const response = await client.embeddings.create({
    model,
    input: text,
    encoding_format: "float",
    ...(isGeminiModel(model) || model.startsWith("text-embedding-3")
      ? { dimensions: EMBEDDING_DIMENSIONS }
      : {}),
  });
  const embedding = checkEmbedding(response.data?.[0]?.embedding);
  await recordUsage(model, "embedding", response.usage?.prompt_tokens || 0, 0);
  return embedding;
}

/**
 * Embed several texts; Voyage takes them in batches, other providers one by one.
 * `budget: "index"` charges admin indexing instead of the chat model budget.
 */
export async function generateEmbeddings(
  texts: string[],
  model: string = MODELS.EMBEDDING,
  inputType: EmbeddingInputType = "document",
  budget: "chat" | "index" = "chat",
): Promise<number[][]> {
  if (!texts.length) return [];
  const consumeBudget =
    budget === "index" ? consumeIndexBudget : consumeModelBudget;
  if (isVoyageModel(model)) {
    // One budget request per call, sized by characters like the other providers.
    await consumeBudget(texts.reduce((n, text) => n + text.length, 0));
    return embedWithVoyage(texts, model, inputType);
  }
  const vectors: number[][] = [];
  for (const text of texts)
    vectors.push(await embedWithOpenAI(text, model, consumeBudget));
  return vectors;
}

export async function generateEmbedding(
  text: string,
  model: string = MODELS.EMBEDDING,
  inputType: EmbeddingInputType = "query",
): Promise<number[]> {
  return (await generateEmbeddings([text], model, inputType))[0];
}
async function recordUsage(
  model: string,
  purpose: string,
  promptTokens: number,
  completionTokens: number,
) {
  await db
    .insert(schema.modelUsage)
    .values({ model, purpose, promptTokens, completionTokens });
}
export async function chatCompletion(
  messages: OpenAI.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
    purpose?: "chat" | "classification" | "evaluation";
  },
) {
  const model = options?.model || MODELS.TEXT;
  const client = await getClientForModel(model);

  await consumeModelBudget(
    JSON.stringify(messages).length + (options?.maxTokens ?? 2000),
  );
  const response = await client.chat.completions.create(
    {
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    },
    { signal: options?.signal },
  );

  await recordUsage(
    model,
    options?.purpose || "chat",
    response.usage?.prompt_tokens || 0,
    response.usage?.completion_tokens || 0,
  );
  return response;
}

// ─── Chat Completion with Streaming ───────────────────────────

export async function chatCompletionStream(
  messages: OpenAI.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    signal?: AbortSignal;
    purpose?: "chat" | "classification" | "evaluation";
  },
) {
  const model = options?.model || MODELS.TEXT;
  const client = await getClientForModel(model);

  await consumeModelBudget(
    JSON.stringify(messages).length + (options?.maxTokens ?? 2000),
  );
  const response = await client.chat.completions.create(
    {
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      stream: true,
      stream_options: { include_usage: true },
    },
    { signal: options?.signal },
  );
  return (async function* () {
    let promptTokens = 0;
    let completionTokens = 0;
    try {
      for await (const chunk of response) {
        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens;
          completionTokens = chunk.usage.completion_tokens;
        }
        yield chunk;
      }
    } finally {
      response.controller.abort();
      await recordUsage(model, "stream", promptTokens, completionTokens);
    }
  })();
}

// ─── Analyze Image ────────────────────────────────────────────

export async function analyzeImage(
  imageUrl: string,
  prompt: string = "Describe this image in detail.",
  model: string = MODELS.IMAGE,
) {
  const client = await getClientForModel(model);
  await consumeModelBudget(prompt.length + 4096);
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 1000,
  });

  await recordUsage(
    model,
    "image",
    response.usage?.prompt_tokens || 0,
    response.usage?.completion_tokens || 0,
  );
  return response.choices[0].message.content;
}
