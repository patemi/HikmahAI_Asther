import OpenAI from "openai";
import { db } from "@/lib/db";

let cachedClient: OpenAI | null = null;
let cachedKey: string | null = null;
let cachedBaseUrl: string | null = null;
let cachedEmbeddingClient: OpenAI | null = null;
let cachedEmbeddingKey: string | null = null;
let cachedEmbeddingBaseUrl: string | null = null;

async function resolveClientConfig() {
  const config = await db.query.appConfig.findFirst({
    columns: { openaiApiKey: true, baseUrl: true },
  });

  const apiKey =
    process.env.LLM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    config?.openaiApiKey ||
    "";
  const baseUrl =
    (process.env.BASE_URL || process.env.STRIX_BASE_URL || config?.baseUrl || "").trim();

  return { apiKey, baseUrl };
}

function resolveEmbeddingConfig() {
  const apiKey =
    process.env.EMBEDDING_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.LLM_API_KEY ||
    "";
  const baseUrl = (process.env.EMBEDDING_BASE_URL || "").trim();

  return { apiKey, baseUrl };
}

async function getOpenAIClient() {
  const { apiKey, baseUrl } = await resolveClientConfig();
  if (!apiKey) {
    throw new Error("OpenAI API key is not set");
  }

  if (!cachedClient || cachedKey !== apiKey || cachedBaseUrl !== baseUrl) {
    cachedKey = apiKey;
    cachedBaseUrl = baseUrl;
    cachedClient = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
      defaultHeaders: {
        "x-api-key": apiKey,
      },
    });
  }

  return cachedClient;
}

function getEmbeddingClient() {
  const { apiKey, baseUrl } = resolveEmbeddingConfig();
  if (!apiKey) {
    throw new Error("Embedding API key is not set");
  }

  if (
    !cachedEmbeddingClient ||
    cachedEmbeddingKey !== apiKey ||
    cachedEmbeddingBaseUrl !== baseUrl
  ) {
    cachedEmbeddingKey = apiKey;
    cachedEmbeddingBaseUrl = baseUrl;
    cachedEmbeddingClient = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
    });
  }

  return cachedEmbeddingClient;
}

// Model constants
export const MODELS = {
  TEXT: process.env.STRIX_LLM || process.env.LLM_MODEL || "gpt-5",
  IMAGE: "gpt-4.1",
  EMBEDDING: "text-embedding-3-small",
} as const;

// Generate embeddings for a text
export async function generateEmbedding(
  text: string,
  model: string = MODELS.EMBEDDING
): Promise<number[]> {
  const openai = getEmbeddingClient();
  const response = await openai.embeddings.create({
    model,
    input: text,
  });

  return response.data[0].embedding;
}

// Chat completion
export async function chatCompletion(
  messages: OpenAI.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const openai = await getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: options?.model || MODELS.TEXT,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens,
  });

  return response;
}

// Chat completion with streaming
export async function chatCompletionStream(
  messages: OpenAI.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const openai = await getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: options?.model || MODELS.TEXT,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens,
    stream: true,
  });

  return response;
}

// Analyze image
export async function analyzeImage(
  imageUrl: string,
  prompt: string = "Describe this image in detail.",
  model: string = MODELS.IMAGE
) {
  const openai = await getOpenAIClient();
  const response = await openai.chat.completions.create({
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

  return response.choices[0].message.content;
}
