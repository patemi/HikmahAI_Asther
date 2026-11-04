import { z } from "zod";
import { db, schema } from "@/lib/db";
import { and, desc, eq, lt } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import {
  assertSameOrigin,
  errorResponse,
  HttpError,
  readJsonRequest,
} from "@/lib/http";
import { consumeLimit } from "@/lib/limits";

const inputSchema = z.object({
  messageId: z.uuid(),
  reason: z.enum(["incorrect", "citation", "unclear", "other"]),
  details: z.string().trim().max(2000).optional(),
});
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getSession();
    if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
    await consumeLimit("feedback", user.id, 20, 86400);
    const parsed = inputSchema.safeParse(await readJsonRequest(request, 8192));
    if (!parsed.success)
      throw new HttpError(400, parsed.error.issues[0].message);
    const message = await db.query.chatMessages.findFirst({
      where: eq(schema.chatMessages.id, parsed.data.messageId),
    });
    if (!message || message.role !== "assistant")
      throw new HttpError(404, "Jawaban tidak ditemukan.");
    const participant = await db.query.chatParticipants.findFirst({
      where: eq(schema.chatParticipants.id, message.participantId),
    });
    const owner =
      participant?.metadata &&
      typeof participant.metadata === "object" &&
      "userId" in participant.metadata
        ? participant.metadata.userId
        : null;
    if (owner !== user.id) throw new HttpError(404, "Jawaban tidak ditemukan.");
    const question = await db.query.chatMessages.findFirst({
      where: and(
        eq(schema.chatMessages.participantId, message.participantId),
        eq(schema.chatMessages.role, "user"),
        lt(schema.chatMessages.createdAt, message.createdAt),
      ),
      orderBy: [desc(schema.chatMessages.createdAt)],
    });
    const [report] = await db
      .insert(schema.answerFeedback)
      .values({
        messageId: message.id,
        reporterId: user.id,
        reason: parsed.data.reason,
        details: parsed.data.details,
        snapshot: {
          question: question?.content || "",
          answer: message.content,
          citations: message.citations,
          provenance: message.provenance,
        },
      })
      .onConflictDoNothing()
      .returning({ id: schema.answerFeedback.id });
    return Response.json(
      { success: true, duplicate: !report },
      { status: report ? 201 : 200 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
