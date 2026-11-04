import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { ownedConversation, ownerCondition } from "@/lib/conversations";
import {
  assertSameOrigin,
  errorResponse,
  HttpError,
  readJsonRequest,
} from "@/lib/http";
type Context = { params: Promise<{ participantId: string }> };
export async function GET(request: Request, context: Context) {
  try {
    const user = await getSession();
    if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
    const { participantId } = await context.params;
    const participant = await ownedConversation(user.id, participantId);
    const before = new URL(request.url).searchParams.get("before");
    if (before && !z.uuid().safeParse(before).success)
      throw new HttpError(400, "Cursor riwayat tidak valid.");
    const anchor = before
      ? await db.query.chatMessages.findFirst({
          where: and(
            eq(schema.chatMessages.id, before),
            eq(schema.chatMessages.participantId, participant.id),
            eq(schema.chatMessages.isActive, true),
          ),
        })
      : undefined;
    if (before && !anchor)
      throw new HttpError(400, "Cursor riwayat tidak ditemukan.");
    const rows = await db.query.chatMessages.findMany({
      where: and(
        eq(schema.chatMessages.participantId, participant.id),
        eq(schema.chatMessages.isActive, true),
        anchor
          ? or(
              lt(schema.chatMessages.createdAt, anchor.createdAt),
              and(
                eq(schema.chatMessages.createdAt, anchor.createdAt),
                lt(schema.chatMessages.id, anchor.id),
              ),
            )
          : undefined,
      ),
      orderBy: [
        desc(schema.chatMessages.createdAt),
        desc(schema.chatMessages.id),
      ],
      limit: 51,
    });
    const lastUser = await db.query.chatMessages.findFirst({
      where: and(
        eq(schema.chatMessages.participantId, participant.id),
        eq(schema.chatMessages.role, "user"),
        eq(schema.chatMessages.isActive, true),
      ),
      orderBy: [
        desc(schema.chatMessages.createdAt),
        desc(schema.chatMessages.id),
      ],
    });
    const messages = rows.slice(0, 50).reverse();
    return Response.json({
      participant: {
        participantId: participant.externalId,
        nickname: participant.name,
        title:
          participant.metadata &&
          typeof participant.metadata === "object" &&
          "title" in participant.metadata
            ? participant.metadata.title
            : "Percakapan baru",
        pinned: participant.pinned,
        archived: participant.archived,
      },
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        attachments: m.attachments,
        feedback: m.feedback,
        createdAt: m.createdAt,
        citations: m.citations,
        citationNotice: m.citationNotice,
        provenance: m.provenance,
      })),
      busy: Boolean(
        participant.processingUntil && participant.processingUntil > new Date(),
      ),
      lastUserId: lastUser?.id || null,
      hasMore: rows.length > 50,
      nextCursor: rows.length > 50 ? messages[0]?.id : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const user = await getSession();
    if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
    const { participantId } = await context.params;
    const participant = await ownedConversation(user.id, participantId);
    const parsed = z
      .object({
        title: z
          .string()
          .trim()
          .min(1)
          .max(120)
          .transform((s) => s.replace(/\s+/g, " "))
          .optional(),
        pinned: z.boolean().optional(),
        archived: z.boolean().optional(),
      })
      .refine(
        (input) =>
          input.title !== undefined ||
          input.pinned !== undefined ||
          input.archived !== undefined,
      )
      .safeParse(await readJsonRequest(request, 2048));
    if (!parsed.success)
      throw new HttpError(400, "Judul atau status sematan tidak valid.");
    await db
      .update(schema.chatParticipants)
      .set({
        ...(parsed.data.title !== undefined
          ? {
              metadata: sql`jsonb_set(coalesce(${schema.chatParticipants.metadata}, '{}'::jsonb), '{title}', to_jsonb(${parsed.data.title}::text), true)`,
            }
          : {}),
        ...(parsed.data.pinned !== undefined
          ? { pinned: parsed.data.pinned }
          : {}),
        ...(parsed.data.archived !== undefined
          ? { archived: parsed.data.archived }
          : {}),
      })
      .where(
        and(
          eq(schema.chatParticipants.id, participant.id),
          ownerCondition(user.id),
        ),
      );
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
