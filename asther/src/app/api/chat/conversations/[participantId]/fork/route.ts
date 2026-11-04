import { randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";
import { and, asc, eq, lt, or } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ownedConversation } from "@/lib/conversations";
import {
  assertSameOrigin,
  readJsonRequest,
  errorResponse,
  HttpError,
} from "@/lib/http";
type Context = { params: Promise<{ participantId: string }> };
export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const user = await getSession();
    if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
    const participant = await ownedConversation(
      user.id,
      (await context.params).participantId,
    );
    const parsed = z
      .object({ beforeMessageId: z.uuid() })
      .safeParse(await readJsonRequest(request, 1024));
    if (!parsed.success) throw new HttpError(400, "Pesan tidak valid.");
    const externalId = "chat-" + randomUUID();
    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(schema.chatParticipants)
        .where(eq(schema.chatParticipants.id, participant.id))
        .for("update");
      if (!locked) throw new HttpError(404, "Percakapan tidak ditemukan.");
      if (locked.processingUntil && locked.processingUntil > new Date())
        throw new HttpError(409, "Tunggu jawaban selesai sebelum mengedit.");
      const anchor = await tx.query.chatMessages.findFirst({
        where: and(
          eq(schema.chatMessages.id, parsed.data.beforeMessageId),
          eq(schema.chatMessages.participantId, participant.id),
          eq(schema.chatMessages.role, "user"),
          eq(schema.chatMessages.isActive, true),
        ),
      });
      if (!anchor) throw new HttpError(404, "Pertanyaan tidak ditemukan.");
      const prefix = await tx.query.chatMessages.findMany({
        where: and(
          eq(schema.chatMessages.participantId, participant.id),
          eq(schema.chatMessages.isActive, true),
          or(
            lt(schema.chatMessages.createdAt, anchor.createdAt),
            and(
              eq(schema.chatMessages.createdAt, anchor.createdAt),
              lt(schema.chatMessages.id, anchor.id),
            ),
          ),
        ),
        orderBy: [
          asc(schema.chatMessages.createdAt),
          asc(schema.chatMessages.id),
        ],
        limit: 501,
      });
      if (prefix.length > 500)
        throw new HttpError(
          413,
          "Percakapan terlalu panjang untuk dicabangkan.",
        );
      const meta = participant.metadata as { title?: unknown } | null;
      const [branch] = await tx
        .insert(schema.chatParticipants)
        .values({
          externalId,
          name: participant.name,
          metadata: {
            userId: user.id,
            title:
              (typeof meta?.title === "string"
                ? meta.title.slice(0, 95)
                : "Percakapan") + " (cabang)",
          },
        })
        .returning();
      // New UUIDs must not shuffle messages that originally shared a timestamp.
      let beforeTime = Number.POSITIVE_INFINITY;
      if (prefix.length)
        await tx.insert(schema.chatMessages).values(
          prefix
            .toReversed()
            .map((m) => {
              beforeTime = Math.min(m.createdAt.getTime(), beforeTime - 1);
              return {
                participantId: branch.id,
                role: m.role,
                content: m.content,
                attachments: m.attachments,
                imageUrl: m.imageUrl,
                imageAnalysis: m.imageAnalysis,
                citations: m.citations,
                citationNotice: m.citationNotice,
                provenance: m.provenance,
                createdAt: new Date(beforeTime),
              };
            })
            .reverse(),
        );
    });
    return Response.json({ participantId: externalId }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
