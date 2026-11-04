"use server";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import {
  addDocument,
  countPendingChunks,
  deleteDocument,
  embedPendingChunks,
  rebuildDocumentChunks,
} from "@/lib/rag";
import { HttpError } from "@/lib/http";
import { documentInputSchema, parseKnowledgeJson } from "@/lib/knowledge-input";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function refresh() {
  revalidatePath("/dashboard/knowledge");
  revalidatePath("/dashboard/knowledge/upload");
}
function input(form: FormData) {
  return documentInputSchema.safeParse(
    Object.fromEntries(
      ["title", "content", "source", "author", "locator"].map((key) => [
        key,
        form.get(key) || "",
      ]),
    ),
  );
}
export async function getDocument(id: string) {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success)
    return { error: "ID dokumen tidak valid." };
  const doc = await db.query.knowledgeDocuments.findFirst({
    where: eq(schema.knowledgeDocuments.id, id),
  });
  if (!doc) return { error: "Dokumen sudah tidak ada. Muat ulang halaman." };
  return { document: doc };
}
export async function createDocument(form: FormData) {
  await requireAdmin();
  const parsed = input(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const { title, content, source, author, locator } = parsed.data;
    await addDocument(title, content, source, undefined, { author, locator });
    refresh();
    return { success: true };
  } catch {
    return { error: "Dokumen belum dapat disimpan. Silakan coba kembali." };
  }
}
export async function importJsonDocuments(form: FormData) {
  await requireAdmin();
  const files = form
    .getAll("jsonFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (
    !files.length ||
    files.length > 10 ||
    files.reduce((n, file) => n + file.size, 0) > 2_000_000
  )
    return { error: "Pilih maksimal 10 file JSON dengan ukuran total 2 MB." };
  try {
    const documents: Array<z.infer<typeof documentInputSchema>> = [];
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".json"))
        return { error: "Hanya file JSON yang didukung." };
      documents.push(
        ...parseKnowledgeJson(
          await file.text(),
          file.name.replace(/\.json$/i, ""),
        ),
      );
    }
    if (!documents.length || documents.length > 100)
      return { error: "Impor harus berisi 1 sampai 100 dokumen." };
    let importedCount = 0;
    try {
      for (const { title, content, source, author, locator } of documents) {
        await addDocument(title, content, source, undefined, {
          author,
          locator,
        });
        importedCount++;
      }
    } catch {
      refresh();
      return {
        error:
          "Impor terhenti setelah " +
          importedCount +
          " dokumen tersimpan sebagai draft. Periksa daftar sebelum mengimpor ulang.",
      };
    }
    refresh();
    return { success: true, importedCount, fileCount: files.length };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Format JSON tidak valid.",
    };
  }
}
export async function updateDocument(form: FormData) {
  await requireAdmin();
  const parsed = input(form);
  const id = z.uuid().safeParse(form.get("documentId"));
  const version = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(form.get("version"));
  if (!parsed.success || !id.success || !version.success)
    return { error: "Isi dokumen atau versi tidak valid. Muat ulang halaman." };
  try {
    const { title, content, source, author, locator } = parsed.data;
    await rebuildDocumentChunks(id.data, content, {
      title,
      source: source || null,
      author: author || null,
      locator: locator || null,
      expectedVersion: version.data,
    });
    refresh();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Dokumen belum dapat diperbarui.",
    };
  }
}
export async function removeDocument(id: string) {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success)
    return { error: "ID dokumen tidak valid." };
  await deleteDocument(id);
  refresh();
  return { success: true };
}
export async function getEmbeddingProgress() {
  await requireAdmin();
  return countPendingChunks();
}
/** One step of the bulk embedding loop driven by the dashboard. */
export async function embedPendingBatch(size: number) {
  await requireAdmin();
  const batchSize = Math.max(1, Math.min(Math.floor(size) || 1, 256));
  try {
    return await embedPendingChunks(batchSize);
  } catch (error) {
    if (error instanceof HttpError && error.status === 429)
      return { error: error.message, retryAfter: error.retryAfter ?? 20 };
    console.warn(
      "[Knowledge] Bulk embedding batch failed.",
      error instanceof Error ? error.message : error,
    );
    return {
      error:
        error instanceof Error
          ? error.message
          : "Batch embedding gagal. Coba lagi.",
    };
  }
}
export async function reviewDocument(form: FormData) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      documentId: z.uuid(),
      version: z.coerce.number().int().positive(),
      status: z.enum(["draft", "review", "published"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Permintaan tinjauan tidak valid." };
  const { documentId, version, status } = parsed.data;
  const doc = await db.query.knowledgeDocuments.findFirst({
    where: eq(schema.knowledgeDocuments.id, documentId),
  });
  if (!doc || doc.version !== version)
    return { error: "Dokumen telah berubah. Muat ulang halaman." };
  if (status === "published" && form.get("reviewConfirmed") !== "on")
    return { error: "Konfirmasi pemeriksaan isi dan sumber diperlukan." };
  if (
    status === "published" &&
    (doc.status !== "review" || !doc.source?.trim())
  )
    return {
      error:
        "Dokumen harus dalam tinjauan dan memiliki identitas sumber sebelum diterbitkan.",
    };
  const [updated] = await db
    .update(schema.knowledgeDocuments)
    .set({
      status,
      reviewedBy: status === "published" ? admin.name || admin.email : null,
      reviewedAt: status === "published" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.knowledgeDocuments.id, documentId),
        eq(schema.knowledgeDocuments.version, version),
        eq(schema.knowledgeDocuments.status, doc.status),
      ),
    )
    .returning({ id: schema.knowledgeDocuments.id });
  if (!updated)
    return { error: "Status dokumen sudah berubah. Muat ulang halaman." };
  refresh();
  return { success: true };
}
