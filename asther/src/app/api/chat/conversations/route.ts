import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { desc, eq, sql } from "drizzle-orm";

function getUserIdFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const userId = (metadata as { userId?: unknown }).userId;
  return typeof userId === "string" ? userId : null;
}

function getTitleFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const title = (metadata as { title?: unknown }).title;
  return typeof title === "string" && title.trim() ? title.trim() : null;
}

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const participants = await db.query.chatParticipants.findMany({
    where: sql`${schema.chatParticipants.metadata}->>'userId' = ${user.id}`,
    orderBy: [desc(schema.chatParticipants.updatedAt)],
  });

  const conversations = await Promise.all(
    participants.map(async (participant) => {
      const lastMessage = await db.query.chatMessages.findFirst({
        where: eq(schema.chatMessages.participantId, participant.id),
        orderBy: [desc(schema.chatMessages.createdAt)],
      });

      return {
        participantId: participant.externalId,
        title: getTitleFromMetadata(participant.metadata) || "Percakapan baru",
        preview: (lastMessage?.content || "").slice(0, 80),
        updatedAt: lastMessage?.createdAt || participant.updatedAt,
        nickname: participant.name || null,
      };
    })
  );

  conversations.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return NextResponse.json({ conversations });
}

export async function DELETE(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const participantId = String(body?.participantId || "");
  if (!participantId) {
    return NextResponse.json({ error: "participantId is required" }, { status: 400 });
  }

  const participant = await db.query.chatParticipants.findFirst({
    where: eq(schema.chatParticipants.externalId, participantId),
  });

  if (!participant) {
    return NextResponse.json({ success: true });
  }

  const ownerId = getUserIdFromMetadata(participant.metadata);
  if (ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .delete(schema.chatParticipants)
    .where(eq(schema.chatParticipants.id, participant.id));

  return NextResponse.json({ success: true });
}
