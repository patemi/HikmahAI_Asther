import { db, schema } from "@/lib/db";
import { sql, lt, and } from "drizzle-orm";
export async function runMaintenance() {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('hikmah-maintenance'))`,
    );
    await tx
      .delete(schema.sessions)
      .where(lt(schema.sessions.expiresAt, new Date()));
    await tx
      .delete(schema.rateLimitBuckets)
      .where(
        lt(schema.rateLimitBuckets.resetAt, new Date(Date.now() - 86400000)),
      );
    const retention = Number(process.env.CHAT_RETENTION_DAYS || 0);
    if (Number.isInteger(retention) && retention > 0 && retention <= 36500) {
      const cutoff = new Date(Date.now() - retention * 86400000);
      await tx
        .delete(schema.chatMessages)
        .where(lt(schema.chatMessages.createdAt, cutoff));
      await tx
        .delete(schema.chatParticipants)
        .where(
          and(
            lt(schema.chatParticipants.updatedAt, cutoff),
            sql`${schema.chatParticipants.processingUntil} IS NULL`,
            sql`NOT EXISTS (SELECT 1 FROM ${schema.chatMessages} WHERE ${schema.chatMessages.participantId} = ${schema.chatParticipants.id})`,
          ),
        );
    }
  });
}
