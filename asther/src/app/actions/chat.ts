"use server";

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteParticipantChat(participantId: string) {
  try {
    // Delete all messages for this participant
    await db
      .delete(schema.chatMessages)
      .where(eq(schema.chatMessages.participantId, participantId));

    // Delete the participant record
    await db
      .delete(schema.chatParticipants)
      .where(eq(schema.chatParticipants.id, participantId));

    revalidatePath("/dashboard/history");

    return { success: true };
  } catch (error) {
    console.error("Delete participant error:", error);
    return { error: "Failed to delete chat history" };
  }
}
