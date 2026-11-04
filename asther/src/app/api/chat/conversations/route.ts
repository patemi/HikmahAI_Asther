import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { ownerCondition, ownedConversation } from "@/lib/conversations";
import {
  assertSameOrigin,
  errorResponse,
  HttpError,
  readJsonRequest,
} from "@/lib/http";
export async function GET(request?: Request) {
  try {
    const user = await getSession();
    if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
    const params = new URL(request?.url || "http://localhost").searchParams;
    const parsed = z
      .object({
        q: z.string().trim().max(120),
        page: z.coerce.number().int().min(1).max(10000),
        archived: z.enum(["true", "false"]),
      })
      .safeParse({
        q: params.get("q") || "",
        page: params.get("page") || 1,
        archived: params.get("archived") || "false",
      });
    if (!parsed.success) throw new HttpError(400, "Pencarian tidak valid.");
    const { q, page } = parsed.data;
    const search = "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
    const participants = await db
      .select({
        participantId: schema.chatParticipants.externalId,
        title: sql<string>`coalesce(nullif(${schema.chatParticipants.metadata}->>'title', ''), 'Percakapan baru')`,
        pinned: schema.chatParticipants.pinned,
        archived: schema.chatParticipants.archived,
        nickname: schema.chatParticipants.name,
        updatedAt: schema.chatParticipants.updatedAt,
        preview: sql<string>`coalesce((SELECT left(m.content, 100) FROM ${schema.chatMessages} m WHERE m.participant_id = ${schema.chatParticipants.id} AND m.is_active = true ORDER BY m.created_at DESC, m.id DESC LIMIT 1), '')`,
      })
      .from(schema.chatParticipants)
      .where(
        and(
          ownerCondition(user.id),
          eq(schema.chatParticipants.archived, parsed.data.archived === "true"),
          q
            ? sql`(${schema.chatParticipants.metadata}->>'title' ILIKE ${search} OR EXISTS (SELECT 1 FROM ${schema.chatMessages} m WHERE m.participant_id = ${schema.chatParticipants.id} AND m.is_active = true AND m.content ILIKE ${search}))`
            : undefined,
        ),
      )
      .orderBy(
        desc(schema.chatParticipants.pinned),
        desc(schema.chatParticipants.updatedAt),
        desc(schema.chatParticipants.id),
      )
      .limit(31)
      .offset((page - 1) * 30);
    return Response.json({
      conversations: participants.slice(0, 30),
      hasMore: participants.length > 30,
      nextPage: participants.length > 30 ? page + 1 : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getSession();
    if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
    const parsed = z
      .object({ participantId: z.string().min(1).max(200) })
      .safeParse(await readJsonRequest(request));
    if (!parsed.success) throw new HttpError(400, "ID percakapan tidak valid.");
    const participant = await ownedConversation(
      user.id,
      parsed.data.participantId,
    );
    const [deleted] = await db
      .delete(schema.chatParticipants)
      .where(
        and(
          eq(schema.chatParticipants.id, participant.id),
          ownerCondition(user.id),
          sql`(${schema.chatParticipants.processingUntil} IS NULL OR ${schema.chatParticipants.processingUntil} <= now())`,
        ),
      )
      .returning({ id: schema.chatParticipants.id });
    if (!deleted)
      throw new HttpError(
        409,
        "Tunggu jawaban selesai sebelum menghapus percakapan.",
      );
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
