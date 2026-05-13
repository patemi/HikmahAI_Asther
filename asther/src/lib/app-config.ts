import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

let appConfigSchemaEnsured = false;

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidateErrors = [
    error as { code?: unknown; message?: unknown },
    (error as { cause?: unknown }).cause as { code?: unknown; message?: unknown } | undefined,
  ].filter(Boolean) as Array<{ code?: unknown; message?: unknown }>;

  for (const candidate of candidateErrors) {
    if (candidate.code === "42703") {
      return true;
    }

    if (typeof candidate.message === "string" && /column .* does not exist/i.test(candidate.message)) {
      return true;
    }
  }

  return false;
}

export async function ensureAppConfigSchema() {
  if (appConfigSchemaEnsured) return;

  await db.execute(sql`
    ALTER TABLE "app_config"
    ADD COLUMN IF NOT EXISTS "base_url" text
  `);

  await db.execute(sql`
    ALTER TABLE "app_config"
    ADD COLUMN IF NOT EXISTS "guardrail_level" text DEFAULT 'standar' NOT NULL
  `);

  await db.execute(sql`
    ALTER TABLE "app_config"
    ADD COLUMN IF NOT EXISTS "citation_strict" boolean DEFAULT false NOT NULL
  `);

  appConfigSchemaEnsured = true;
}

export async function getAppConfig() {
  // Attempt schema auto-heal proactively so older databases don't fail the typed select.
  try {
    await ensureAppConfigSchema();
  } catch (error) {
    console.warn("[Config] ensureAppConfigSchema failed, continuing with read fallback:", error);
  }

  try {
    return await db.query.appConfig.findFirst();
  } catch (error) {
    if (isMissingColumnError(error)) {
      try {
        await ensureAppConfigSchema();
        return await db.query.appConfig.findFirst();
      } catch (retryError) {
        console.warn("[Config] typed appConfig query retry failed:", retryError);
      }
    }

    // Last-resort raw read to prevent runtime crashes from schema drift.
    try {
      const result = await db.execute(sql`SELECT * FROM "app_config" LIMIT 1`);
      const row = (result as { rows?: Array<Record<string, unknown>> }).rows?.[0];
      if (!row) return undefined;

      return {
        id: (row.id as string) ?? "",
        botName: (row.bot_name as string) ?? "Asther",
        botPersonality: (row.bot_personality as string | null) ?? null,
        systemPrompt: (row.system_prompt as string | null) ?? null,
        apiKeyHash: (row.api_key_hash as string | null) ?? null,
        openaiApiKey: (row.openai_api_key as string | null) ?? null,
        baseUrl: (row.base_url as string | null) ?? null,
        textModel: (row.text_model as string) ?? "gpt-5",
        imageModel: (row.image_model as string) ?? "gpt-4.1",
        embeddingModel: (row.embedding_model as string) ?? "text-embedding-3-small",
        ragEnabled: Boolean(row.rag_enabled ?? false),
        ragTopK: Number(row.rag_top_k ?? 5),
        ragMinScore: Number(row.rag_min_score ?? 70),
        memoryLength: Number(row.memory_length ?? 5),
        guardrailLevel: (row.guardrail_level as string) ?? "standar",
        citationStrict: Boolean(row.citation_strict ?? false),
        createdAt: (row.created_at as Date) ?? new Date(),
        updatedAt: (row.updated_at as Date) ?? new Date(),
      };
    } catch (rawError) {
      console.error("[Config] raw app_config fallback failed:", rawError);
      throw error;
    }
  }
}
