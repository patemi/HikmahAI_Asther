import { db, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { HttpError } from "@/lib/http";
export async function ownedConversation(userId: string, externalId: string) {
  if (!externalId || externalId.length > 200)
    throw new HttpError(400, "ID percakapan tidak valid.");
  const participant = await db.query.chatParticipants.findFirst({
    where: eq(schema.chatParticipants.externalId, externalId),
  });
  if (!participant) throw new HttpError(404, "Percakapan tidak ditemukan.");
  if (
    !participant.metadata ||
    typeof participant.metadata !== "object" ||
    !("userId" in participant.metadata) ||
    participant.metadata.userId !== userId
  )
    throw new HttpError(403, "Kamu tidak punya akses ke percakapan ini.");
  return participant;
}
export function ownerCondition(userId: string) {
  return sql`${schema.chatParticipants.metadata}->>'userId' = ${userId}`;
}
