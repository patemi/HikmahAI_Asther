import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });
try {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('hikmah-bootstrap'))`,
    );
    const admin = await tx.query.users.findFirst({
      where: eq(schema.users.role, "admin"),
    });
    if (!admin) {
      const identity = process.env.DEFAULT_USERNAME?.trim();
      if (!identity)
        throw new Error(
          "Set DEFAULT_USERNAME to the intended administrator before seeding.",
        );
      const existing = await tx.query.users.findFirst({
        where: eq(schema.users.email, identity),
      });
      if (existing) {
        await tx
          .update(schema.users)
          .set({ role: "admin" })
          .where(eq(schema.users.id, existing.id));
        console.log(
          "Configured existing administrator retained; password unchanged.",
        );
      } else {
        const password = process.env.DEFAULT_PASSWORD || "";
        if (
          password.length < 12 ||
          Buffer.byteLength(password) > 72 ||
          password === "your-admin-password"
        )
          throw new Error(
            "Set DEFAULT_PASSWORD to a unique password of 12+ characters (max 72 bytes).",
          );
        await tx
          .insert(schema.users)
          .values({
            email: identity,
            passwordHash: await bcrypt.hash(password, 12),
            name: "Pengelola",
            role: "admin",
          });
        console.log("Configured administrator created.");
      }
    }
    const config = await tx.query.appConfig.findFirst();
    if (!config) {
      const token =
        process.env.BEARER_TOKEN && process.env.BEARER_TOKEN !== "changeme"
          ? process.env.BEARER_TOKEN
          : randomBytes(32).toString("hex");
      await tx
        .insert(schema.appConfig)
        .values({
          botName: "HikmahAI",
          systemPrompt:
            "Anda adalah asisten edukasi keislaman. Gunakan rujukan terkelola dan nyatakan ketidakpastian dengan jelas.",
          apiKeyHash: await bcrypt.hash(token, 12),
          textModel: process.env.LLM_MODEL || "gpt-4.1-mini",
          imageModel: process.env.IMAGE_MODEL || "gpt-4.1-mini",
          embeddingModel:
            process.env.EMBEDDING_MODEL || "text-embedding-3-small",
          ragEnabled: true,
          citationStrict: true,
        });
    }
  });
  console.log("Bootstrap completed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Bootstrap failed.");
  process.exitCode = 1;
} finally {
  await client.end();
}
