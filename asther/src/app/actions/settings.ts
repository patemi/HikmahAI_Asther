"use server";
import { db, schema } from "@/lib/db";
import { getSession, createSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function updateProfile(form: FormData) {
  const user = await getSession();
  if (!user) return { error: "Silakan masuk terlebih dahulu." };
  const parsed = z
    .object({
      email: z.string().trim().min(1).max(254),
      name: z.string().trim().max(100),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Nama atau email tidak valid." };
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, parsed.data.email),
  });
  if (existing && existing.id !== user.id)
    return { error: "Username/email sudah digunakan." };
  if (
    user.role !== "admin" &&
    parsed.data.email.toLowerCase() ===
      process.env.DEFAULT_USERNAME?.toLowerCase()
  )
    return { error: "Username/email ini tidak dapat digunakan." };
  try {
    await db
      .update(schema.users)
      .set({
        email: parsed.data.email,
        name: parsed.data.name || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch {
    return { error: "Profil belum dapat disimpan." };
  }
}
export async function changePassword(form: FormData) {
  const session = await getSession();
  if (!session) return { error: "Silakan masuk terlebih dahulu." };
  const current = String(form.get("currentPassword") || "");
  const next = String(form.get("newPassword") || "");
  const confirmation = String(form.get("confirmPassword") || "");
  if (!current || !next || next !== confirmation)
    return {
      error:
        "Isi password saat ini dan pastikan konfirmasi password baru sesuai.",
    };
  if (
    next.length < (session.role === "admin" ? 12 : 8) ||
    Buffer.byteLength(next) > 72 ||
    Buffer.byteLength(current) > 72
  )
    return {
      error:
        session.role === "admin"
          ? "Password pengelola minimal 12 karakter dan maksimal 72 byte."
          : "Password minimal 8 karakter dan maksimal 72 byte.",
    };
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.id),
  });
  if (!user || !(await bcrypt.compare(current, user.passwordHash)))
    return { error: "Password saat ini salah." };
  const passwordHash = await bcrypt.hash(next, 12);
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));
    await tx.delete(schema.sessions).where(eq(schema.sessions.userId, user.id));
  });
  await createSession(user.id);
  return { success: true };
}
