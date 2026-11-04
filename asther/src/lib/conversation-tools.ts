import { db, schema } from "@/lib/db";
import { and, asc, eq } from "drizzle-orm";
import { HttpError } from "@/lib/http";
import type { SharedSnapshot } from "@/lib/chat-features";
import { createHash } from "node:crypto";

export function snapshotDigest(snapshot: SharedSnapshot) {
  return createHash("sha256")
    .update(
      JSON.stringify({ title: snapshot.title, messages: snapshot.messages }),
    )
    .digest("hex");
}

export async function conversationSnapshot(
  participant: typeof schema.chatParticipants.$inferSelect,
): Promise<SharedSnapshot> {
  const rows = await db.query.chatMessages.findMany({
    where: and(
      eq(schema.chatMessages.participantId, participant.id),
      eq(schema.chatMessages.isActive, true),
    ),
    orderBy: [asc(schema.chatMessages.createdAt), asc(schema.chatMessages.id)],
    limit: 501,
  });
  if (!rows.length)
    throw new HttpError(400, "Belum ada pesan untuk dibagikan.");
  if (rows.length > 500)
    throw new HttpError(
      413,
      "Percakapan terlalu panjang untuk dibagikan. Mulai cabang yang lebih singkat.",
    );
  const meta = participant.metadata as { title?: unknown } | null;
  const snapshot: SharedSnapshot = {
    title: typeof meta?.title === "string" ? meta.title : "Percakapan Hikmah AI",
    sharedAt: new Date().toISOString(),
    messages: rows
      .filter((r) => r.role === "user" || r.role === "assistant")
      .map((r) => ({
        role: r.role as "user" | "assistant",
        content: r.content,
        sources: r.citations.map((c) => ({
          title: c.title,
          source: c.source,
          excerpt: c.excerpt,
          version: c.version,
        })),
      })),
  };
  if (Buffer.byteLength(JSON.stringify(snapshot)) > 1_000_000)
    throw new HttpError(413, "Isi percakapan terlalu besar untuk dibagikan.");
  return snapshot;
}
