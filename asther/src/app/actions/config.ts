"use server";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getAppConfig } from "@/lib/app-config";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
const configSchema = z.object({
  botName: z.string().trim().min(1).max(100),
  botPersonality: z.string().trim().max(2000),
  systemPrompt: z.string().trim().max(16000),
  textModel: z.string().trim().min(1).max(200),
  imageModel: z.string().trim().min(1).max(200),
  embeddingModel: z.string().trim().min(1).max(200),
  baseUrl: z.union([
    z.literal(""),
    z
      .url()
      .refine(
        (value) =>
          ["https:", "http:"].includes(new URL(value).protocol) &&
          !new URL(value).username &&
          !new URL(value).password,
      ),
  ]),
  ragEnabled: z.boolean(),
  citationStrict: z.boolean(),
  ragTopK: z.coerce.number().int().min(1).max(12),
  ragMinScore: z.coerce.number().int().min(10).max(100),
  memoryLength: z.coerce.number().int().min(1).max(20),
  guardrailLevel: z.enum(["standar", "ketat"]),
  newApiKey: z
    .string()
    .trim()
    .max(72)
    .refine(
      (v) => !v || (v.length >= 32 && Buffer.byteLength(v) <= 72),
      "Token API minimal 32 karakter, maksimal 72 byte.",
    ),
  openaiApiKey: z.string().trim().max(1000),
  geminiApiKey: z.string().trim().max(1000),
});
export async function updateConfig(form: FormData) {
  await requireAdmin();
  const parsed = configSchema.safeParse({
    ...Object.fromEntries(form),
    ragEnabled: form.get("ragEnabled") === "true",
    citationStrict: form.get("citationStrict") === "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { newApiKey, openaiApiKey, geminiApiKey, baseUrl, ...settings } =
    parsed.data;
  try {
    const existing = await getAppConfig();
    if (!existing)
      return {
        error: "Konfigurasi belum diinisialisasi. Jalankan bootstrap aplikasi.",
      };
    const update = {
      ...settings,
      baseUrl: baseUrl || null,
      ...(newApiKey ? { apiKeyHash: await bcrypt.hash(newApiKey, 12) } : {}),
      ...(openaiApiKey ? { openaiApiKey } : {}),
      ...(geminiApiKey ? { geminiApiKey } : {}),
      updatedAt: new Date(),
    };
    await db
      .update(schema.appConfig)
      .set(update)
      .where(eq(schema.appConfig.id, existing.id));
    revalidatePath("/dashboard/config");
    revalidatePath("/dashboard");
    revalidatePath("/chat");
    return {
      success: true,
      message:
        existing.embeddingModel !== settings.embeddingModel
          ? "Tersimpan. Model embedding berubah; buka Basis pengetahuan dan jalankan embedding agar pencarian semantik memakai ruang vektor yang sama."
          : "Konfigurasi tersimpan.",
    };
  } catch {
    return { error: "Konfigurasi belum dapat disimpan." };
  }
}
