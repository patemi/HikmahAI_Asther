import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { verifyApiToken } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

// Verify bearer token
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7);
  return verifyApiToken(token);
}

// Get conversation history
export async function GET(request: NextRequest) {
  const isValid = await verifyAuth(request);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get("participantId");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!participantId) {
    return NextResponse.json(
      { error: "participantId is required" },
      { status: 400 }
    );
  }

  try {
    const participant = await db.query.chatParticipants.findFirst({
      where: eq(schema.chatParticipants.externalId, participantId),
    });

    if (!participant) {
      return NextResponse.json({ messages: [], participant: null });
    }

    const messages = await db.query.chatMessages.findMany({
      where: eq(schema.chatMessages.participantId, participant.id),
      orderBy: [desc(schema.chatMessages.createdAt)],
      limit,
    });

    return NextResponse.json({
      messages: messages.reverse(),
      participant: {
        name: participant.name,
        createdAt: participant.createdAt,
      },
    });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete conversation history
const deleteSchema = z.object({
  participantId: z.string(),
});

export async function DELETE(request: NextRequest) {
  const isValid = await verifyAuth(request);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { participantId } = parsed.data;

    const participant = await db.query.chatParticipants.findFirst({
      where: eq(schema.chatParticipants.externalId, participantId),
    });

    if (!participant) {
      return NextResponse.json({ success: true, deleted: 0 });
    }

    const result = await db
      .delete(schema.chatMessages)
      .where(eq(schema.chatMessages.participantId, participant.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
