import { db, schema } from "@/lib/db";
import { verifyApiToken } from "@/lib/auth";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { HttpError, errorResponse, readJsonRequest } from "@/lib/http";
async function authorize(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token || !(await verifyApiToken(token)))
    throw new HttpError(401, "Unauthorized");
}
const identifier = z.string().trim().min(1).max(200);
export async function GET(request: Request) {
  try {
    await authorize(request);
    const query = new URL(request.url).searchParams;
    const parsed = z
      .object({
        participantId: identifier,
        limit: z.coerce.number().int().min(1).max(200),
      })
      .safeParse({
        participantId: query.get("participantId"),
        limit: query.get("limit") || "50",
      });
    if (!parsed.success)
      throw new HttpError(
        400,
        "Gunakan participantId dan limit antara 1 sampai 200.",
      );
    const participant = await db.query.chatParticipants.findFirst({
      where: eq(schema.chatParticipants.externalId, parsed.data.participantId),
    });
    if (!participant) return Response.json({ messages: [], participant: null });
    const messages = await db.query.chatMessages.findMany({
      where: and(
        eq(schema.chatMessages.participantId, participant.id),
        eq(schema.chatMessages.isActive, true),
      ),
      orderBy: [
        desc(schema.chatMessages.createdAt),
        desc(schema.chatMessages.id),
      ],
      limit: parsed.data.limit,
    });
    return Response.json({
      messages: messages.reverse(),
      participant: { name: participant.name, createdAt: participant.createdAt },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    await authorize(request);
    const parsed = z
      .object({ participantId: identifier })
      .safeParse(await readJsonRequest(request));
    if (!parsed.success) throw new HttpError(400, "participantId tidak valid.");
    const participant = await db.query.chatParticipants.findFirst({
      where: eq(schema.chatParticipants.externalId, parsed.data.participantId),
    });
    if (!participant) return Response.json({ success: true, deleted: 0 });
    // Lock the participant for deletion so a new generation cannot start concurrently.
    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(schema.chatParticipants)
        .where(eq(schema.chatParticipants.id, participant.id))
        .for("update");
      if (!locked) return;
      if (locked.processingUntil && locked.processingUntil > new Date())
        throw new HttpError(
          409,
          "Tunggu jawaban selesai sebelum menghapus riwayat.",
        );
      await tx
        .delete(schema.chatMessages)
        .where(eq(schema.chatMessages.participantId, participant.id));
      await tx
        .update(schema.chatParticipants)
        .set({ updatedAt: new Date() })
        .where(eq(schema.chatParticipants.id, participant.id));
    });
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
