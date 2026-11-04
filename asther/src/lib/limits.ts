import { createHash } from "node:crypto";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { HttpError } from "@/lib/http";

export function limitSetting(name: string, fallback: number, max = 100_000) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 && value <= max
    ? value
    : fallback;
}

export function requestIdentity(request: Request): string {
  // Only trust these headers when the deployment proxy overwrites client values.
  if (process.env.TRUST_PROXY === "true") {
    return (
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"
    ).slice(0, 100);
  }
  return "shared-untrusted-network";
}

export async function consumeLimit(
  scope: string,
  identity: string,
  limit: number,
  windowSeconds: number,
  cost = 1,
) {
  if (cost > limit)
    throw new HttpError(
      429,
      "Permintaan melebihi anggaran pemakaian.",
      windowSeconds,
    );
  const key = createHash("sha256").update(`${scope}:${identity}`).digest("hex");
  const resetAt = new Date(Date.now() + windowSeconds * 1000);
  const [bucket] = await db
    .insert(schema.rateLimitBuckets)
    .values({ key, hits: cost, resetAt })
    .onConflictDoUpdate({
      target: schema.rateLimitBuckets.key,
      set: {
        hits: sql`CASE WHEN ${schema.rateLimitBuckets.resetAt} <= now() THEN ${cost} ELSE ${schema.rateLimitBuckets.hits} + ${cost} END`,
        resetAt: sql`CASE WHEN ${schema.rateLimitBuckets.resetAt} <= now() THEN ${resetAt.toISOString()}::timestamptz ELSE ${schema.rateLimitBuckets.resetAt} END`,
      },
      setWhere: sql`${schema.rateLimitBuckets.resetAt} <= now() OR ${schema.rateLimitBuckets.hits} + ${cost} <= ${limit}`,
    })
    .returning();
  if (!bucket) {
    const [current] = await db
      .select({ resetAt: schema.rateLimitBuckets.resetAt })
      .from(schema.rateLimitBuckets)
      .where(sql`${schema.rateLimitBuckets.key} = ${key}`);
    throw new HttpError(
      429,
      "Batas pemakaian tercapai. Silakan coba kembali setelah jeda.",
      Math.max(
        1,
        Math.ceil(
          ((current?.resetAt.getTime() || Date.now() + 1000) - Date.now()) /
            1000,
        ),
      ),
    );
  }
}

// Admin indexing (imports, edits, bulk embedding) gets its own daily budget so a
// large import cannot use up the allowance that chat answers depend on.
export async function consumeIndexBudget(estimatedMaxTokens: number) {
  await consumeLimit(
    "index-day",
    "all",
    limitSetting("INDEX_REQUESTS_PER_DAY", 5000),
    86400,
  );
  await consumeLimit(
    "index-token-day",
    "all",
    limitSetting("INDEX_TOKENS_PER_DAY", 100_000_000, 1_000_000_000),
    86400,
    estimatedMaxTokens,
  );
}

export async function consumeChatLimits(identity: string) {
  await consumeLimit(
    "chat-minute",
    identity,
    limitSetting("CHAT_REQUESTS_PER_MINUTE", 10),
    60,
  );
  await consumeLimit(
    "chat-day",
    identity,
    limitSetting("CHAT_REQUESTS_PER_DAY", 100),
    86400,
  );
}

export async function consumeModelBudget(estimatedMaxTokens: number) {
  await consumeLimit(
    "model-day",
    "all",
    limitSetting("MODEL_REQUESTS_PER_DAY", 2000),
    86400,
  );
  await consumeLimit(
    "token-day",
    "all",
    limitSetting("MODEL_TOKENS_PER_DAY", 500_000, 100_000_000),
    86400,
    estimatedMaxTokens,
  );
}
