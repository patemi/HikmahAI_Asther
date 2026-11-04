import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ownedConversation } from "@/lib/conversations";
import { conversationSnapshot, snapshotDigest } from "@/lib/conversation-tools";
import {
  assertSameOrigin,
  errorResponse,
  HttpError,
  readJsonRequest,
} from "@/lib/http";
import { z } from "zod";

type Context = { params: Promise<{ participantId: string }> };
async function owner(context: Context) {
  const user = await getSession();
  if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
  return ownedConversation(user.id, (await context.params).participantId);
}
export async function GET(_request: Request, context: Context) {
  try {
    const participant = await owner(context);
    const share = await db.query.conversationShares.findFirst({
      where: eq(schema.conversationShares.participantId, participant.id),
    });
    let preview: Awaited<ReturnType<typeof conversationSnapshot>> | null = null;
    let warning: string | undefined;
    try {
      preview = await conversationSnapshot(participant);
    } catch (error) {
      if (!share || !(error instanceof HttpError) || error.status !== 413)
        throw error;
      warning = error.message;
    }
    return Response.json(
      {
        shareId: share?.id || null,
        snapshot: share?.snapshot || preview!,
        preview,
        previewDigest: preview ? snapshotDigest(preview) : null,
        warning,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const participant = await owner(context);
    const input = z
      .object({ previewDigest: z.string().regex(/^[a-f0-9]{64}$/) })
      .safeParse(await readJsonRequest(request, 1024));
    if (!input.success)
      throw new HttpError(400, "Buka pratinjau percakapan sebelum membagikan.");
    if (participant.processingUntil && participant.processingUntil > new Date())
      throw new HttpError(
        409,
        "Tunggu jawaban selesai sebelum membagikan percakapan.",
      );
    const snapshot = await conversationSnapshot(participant);
    if (snapshotDigest(snapshot) !== input.data.previewDigest)
      throw new HttpError(
        409,
        "Isi percakapan berubah. Tutup dan buka kembali pratinjau sebelum membagikan.",
      );
    const [share] = await db
      .insert(schema.conversationShares)
      .values({ participantId: participant.id, snapshot })
      .onConflictDoUpdate({
        target: schema.conversationShares.participantId,
        set: { snapshot },
      })
      .returning({ id: schema.conversationShares.id });
    return Response.json(
      {
        shareId: share.id,
        snapshot,
        preview: snapshot,
        previewDigest: snapshotDigest(snapshot),
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const participant = await owner(context);
    await db
      .delete(schema.conversationShares)
      .where(eq(schema.conversationShares.participantId, participant.id));
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
