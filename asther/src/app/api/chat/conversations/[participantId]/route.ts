import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";

function getUserIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const userId = (metadata as { userId?: unknown }).userId;
  return typeof userId === "string" ? userId : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { participantId } = await params;

  const participant = await db.query.chatParticipants.findFirst({
    where: eq(schema.chatParticipants.externalId, participantId),
  });

  if (!participant) {
    return NextResponse.json({ messages: [], participant: null });
  }

  const ownerId = getUserIdFromMetadata(participant.metadata);
  if (ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await db.query.chatMessages.findMany({
    where: eq(schema.chatMessages.participantId, participant.id),
    orderBy: [asc(schema.chatMessages.createdAt)],
  });

  return NextResponse.json({
    participant: {
      participantId: participant.externalId,
      nickname: participant.name || null,
    },
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
}
