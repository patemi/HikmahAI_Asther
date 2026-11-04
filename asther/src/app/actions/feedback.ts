"use server";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
export async function reviewFeedback(form: FormData) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      id: z.uuid(),
      status: z.enum(["open", "reviewing", "resolved"]),
      resolution: z.string().trim().max(2000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Isi tinjauan tidak valid." };
  if (parsed.data.status === "resolved" && !parsed.data.resolution)
    return { error: "Catatan penyelesaian wajib diisi." };
  const [updated] = await db
    .update(schema.answerFeedback)
    .set({
      status: parsed.data.status,
      resolution: parsed.data.resolution || null,
      reviewedBy: admin.name || admin.email,
      reviewedAt: new Date(),
    })
    .where(eq(schema.answerFeedback.id, parsed.data.id))
    .returning({ id: schema.answerFeedback.id });
  if (!updated) return { error: "Laporan tidak ditemukan." };
  revalidatePath("/dashboard/reports");
  return { success: true };
}
