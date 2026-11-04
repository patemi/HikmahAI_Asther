import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ownerCondition } from "@/lib/conversations";
import {
  assertSameOrigin,
  readJsonRequest,
  errorResponse,
  HttpError,
} from "@/lib/http";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ messageId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await getSession();
    if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
    const { messageId } = await context.params;
    const parsed = z
      .object({ feedback: z.enum(["up", "down"]).nullable() })
      .safeParse(await readJsonRequest(request, 1024));
    if (!z.uuid().safeParse(messageId).success || !parsed.success)
      throw new HttpError(400, "Penilaian tidak valid.");
    const [message] = await db
      .select({ id: schema.chatMessages.id })
      .from(schema.chatMessages)
      .innerJoin(
        schema.chatParticipants,
        eq(schema.chatMessages.participantId, schema.chatParticipants.id),
      )
      .where(
        and(
          eq(schema.chatMessages.id, messageId),
          eq(schema.chatMessages.role, "assistant"),
          ownerCondition(user.id),
        ),
      )
      .limit(1);
    if (!message) throw new HttpError(404, "Jawaban tidak ditemukan.");
    await db
      .update(schema.chatMessages)
      .set({ feedback: parsed.data.feedback })
      .where(eq(schema.chatMessages.id, message.id));
    return Response.json({ feedback: parsed.data.feedback });
  } catch (error) {
    return errorResponse(error);
  }
}
