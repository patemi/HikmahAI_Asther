"use server";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function deleteParticipantChat(participantId: string) {
  await requireAdmin();
  if (!z.uuid().safeParse(participantId).success)
    return { error: "ID percakapan tidak valid." };
  try {
    const [deleted] = await db
      .delete(schema.chatParticipants)
      .where(
        and(
          eq(schema.chatParticipants.id, participantId),
          sql`(${schema.chatParticipants.processingUntil} IS NULL OR ${schema.chatParticipants.processingUntil} <= now())`,
        ),
      )
      .returning({ id: schema.chatParticipants.id });
    if (!deleted) {
      const existing = await db.query.chatParticipants.findFirst({
        where: eq(schema.chatParticipants.id, participantId),
      });
      if (existing)
        return {
          error: "Tunggu jawaban selesai sebelum menghapus percakapan.",
        };
    }
    revalidatePath("/dashboard/history");
    return { success: true };
  } catch {
    return { error: "Percakapan belum dapat dihapus." };
  }
}
