"use server";

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateConfig(formData: FormData) {
  const botName = formData.get("botName") as string;
  const botPersonality = formData.get("botPersonality") as string;
  const systemPrompt = formData.get("systemPrompt") as string;
  const textModel = formData.get("textModel") as string;
  const imageModel = formData.get("imageModel") as string;
  const embeddingModel = formData.get("embeddingModel") as string;
  const ragEnabled = formData.get("ragEnabled") === "true";
  const ragTopK = parseInt(formData.get("ragTopK") as string) || 5;
  const ragMinScore = parseInt(formData.get("ragMinScore") as string) || 70;
  const memoryLength = parseInt(formData.get("memoryLength") as string) || 5;
  const newApiKey = formData.get("newApiKey") as string;
  const openaiApiKey = formData.get("openaiApiKey") as string;
  const baseUrl = (formData.get("baseUrl") as string) || "";

  try {
    const existing = await db.query.appConfig.findFirst();

    const updateData: Partial<typeof schema.appConfig.$inferInsert> = {
      botName,
      botPersonality,
      systemPrompt,
      textModel,
      imageModel,
      embeddingModel,
      ragEnabled,
      ragTopK,
      ragMinScore,
      memoryLength,
      baseUrl: baseUrl.trim() || null,
      updatedAt: new Date(),
    };

    // Hash new API key if provided
    if (newApiKey && newApiKey.trim()) {
      updateData.apiKeyHash = await bcrypt.hash(newApiKey.trim(), 10);
    }

    if (openaiApiKey && openaiApiKey.trim()) {
      updateData.openaiApiKey = openaiApiKey.trim();
    }

    if (existing) {
      await db
        .update(schema.appConfig)
        .set(updateData)
        .where(eq(schema.appConfig.id, existing.id));
    } else {
      // Create default config with API key
      if (!updateData.apiKeyHash) {
        const defaultToken = process.env.BEARER_TOKEN || "changeme";
        updateData.apiKeyHash = await bcrypt.hash(defaultToken, 10);
      }
      await db.insert(schema.appConfig).values(updateData as typeof schema.appConfig.$inferInsert);
    }

    revalidatePath("/dashboard/config");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update config error:", error);
    return { error: "Failed to update configuration" };
  }
}
