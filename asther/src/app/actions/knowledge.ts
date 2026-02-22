"use server";

import { db, schema } from "@/lib/db";
import { addDocument, deleteDocument } from "@/lib/rag";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type JsonKnowledgeInput = {
  [key: string]: unknown;
  title?: unknown;
  name?: unknown;
  content?: unknown;
  text?: unknown;
  body?: unknown;
  description?: unknown;
  message?: unknown;
  value?: unknown;
  data?: unknown;
  source?: unknown;
  url?: unknown;
  link?: unknown;
  metadata?: unknown;
};

type ParsedDocument = {
  title: string;
  content: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

function normalizeTextValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return "";
}

function toParsedDocument(item: unknown, fallbackTitle: string): ParsedDocument | null {
  if (!item || typeof item !== "object") {
    const primitiveContent = normalizeTextValue(item);
    if (!primitiveContent) return null;
    return { title: fallbackTitle, content: primitiveContent };
  }

  const input = item as JsonKnowledgeInput;

  const title =
    (typeof input.title === "string" && input.title.trim()) ||
    (typeof input.name === "string" && input.name.trim()) ||
    fallbackTitle;

  const source =
    (typeof input.source === "string" && input.source.trim()) ||
    (typeof input.url === "string" && input.url.trim()) ||
    (typeof input.link === "string" && input.link.trim()) ||
    undefined;

  let content = normalizeTextValue(
    input.content ??
      input.text ??
      input.body ??
      input.description ??
      input.message ??
      input.value ??
      input.data
  );

  if (!content) {
    const keys = Object.keys(input);
    if (keys.length === 0) {
      return null;
    }
    content = JSON.stringify(input, null, 2);
  }

  const metadata =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, unknown>)
      : undefined;

  return { title, content, source, metadata };
}

function parseKnowledgeJson(raw: string, fallbackTitle: string): ParsedDocument[] {
  const parsed = JSON.parse(raw) as unknown;

  if (Array.isArray(parsed)) {
    return parsed
      .map((item, index) =>
        toParsedDocument(
          (item ?? {}) as JsonKnowledgeInput,
          `${fallbackTitle} #${index + 1}`
        )
      )
      .filter((doc): doc is ParsedDocument => Boolean(doc));
  }

  if (parsed && typeof parsed === "object") {
    const objectParsed = parsed as Record<string, unknown>;

    if (Array.isArray(objectParsed.documents)) {
      return objectParsed.documents
        .map((item, index) =>
          toParsedDocument(
            (item ?? {}) as JsonKnowledgeInput,
            `${fallbackTitle} #${index + 1}`
          )
        )
        .filter((doc): doc is ParsedDocument => Boolean(doc));
    }

    if (Array.isArray(objectParsed.items)) {
      return objectParsed.items
        .map((item, index) =>
          toParsedDocument(
            item,
            `${fallbackTitle} #${index + 1}`
          )
        )
        .filter((doc): doc is ParsedDocument => Boolean(doc));
    }

    if (Array.isArray(objectParsed.data)) {
      return objectParsed.data
        .map((item, index) =>
          toParsedDocument(
            item,
            `${fallbackTitle} #${index + 1}`
          )
        )
        .filter((doc): doc is ParsedDocument => Boolean(doc));
    }

    const singleDoc = toParsedDocument(objectParsed, fallbackTitle);
    return singleDoc ? [singleDoc] : [];
  }

  return [];
}

export async function createDocument(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const source = formData.get("source") as string;

  try {
    if (!title || !content) {
      return { error: "Title and content are required" };
    }

    await addDocument(title, content, source || undefined);
    revalidatePath("/dashboard/knowledge");
    return { success: true };
  } catch (error) {
    console.error("Create document error:", error);
    return { error: "Failed to create document" };
  }
}

export async function importJsonDocuments(formData: FormData) {
  const files = formData
    .getAll("jsonFiles")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    return { error: "Please select at least one JSON file" };
  }

  try {
    let importedCount = 0;

    for (const jsonFile of files) {
      if (!jsonFile.name.toLowerCase().endsWith(".json")) {
        return { error: `Only .json files are supported (invalid: ${jsonFile.name})` };
      }

      const raw = await jsonFile.text();
      let parsedDocs: ParsedDocument[];

      try {
        const fallbackTitle =
          jsonFile.name.replace(/\.json$/i, "") || "Uploaded JSON Document";
        parsedDocs = parseKnowledgeJson(raw, fallbackTitle);
      } catch {
        return { error: `Invalid JSON format in file: ${jsonFile.name}` };
      }

      if (parsedDocs.length === 0) {
        return {
          error: `No valid documents found in ${jsonFile.name}. Use { title, content }, array of objects, or { documents: [...] }`,
        };
      }

      for (const doc of parsedDocs) {
        await addDocument(doc.title, doc.content, doc.source, doc.metadata);
        importedCount++;
      }
    }

    revalidatePath("/dashboard/knowledge");
    revalidatePath("/dashboard/knowledge/upload");

    return { success: true, importedCount, fileCount: files.length };
  } catch (error) {
    console.error("Import JSON documents error:", error);
    return { error: "Failed to import JSON documents" };
  }
}

export async function updateDocument(formData: FormData) {
  const documentId = formData.get("documentId") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const source = formData.get("source") as string;

  if (!documentId || !title || !content) {
    return { error: "Document ID, title, and content are required" };
  }

  try {
    // Update the document
    await db
      .update(schema.knowledgeDocuments)
      .set({
        title,
        content,
        source: source || null,
        updatedAt: new Date(),
      })
      .where(eq(schema.knowledgeDocuments.id, documentId));

    // Delete old chunks and re-embed
    await db
      .delete(schema.knowledgeChunks)
      .where(eq(schema.knowledgeChunks.documentId, documentId));

    // Chunk the new content
    const chunks = chunkText(content, 500, 50);

    for (let i = 0; i < chunks.length; i++) {
      await db.insert(schema.knowledgeChunks).values({
        documentId,
        content: chunks[i],
        chunkIndex: i,
      });
    }

    revalidatePath("/dashboard/knowledge");
    return { success: true };
  } catch (error) {
    console.error("Update document error:", error);
    return { error: "Failed to update document" };
  }
}

function chunkText(text: string, maxChunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = "";

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(" ");
      currentChunk = words.slice(-Math.ceil(overlap / 5)).join(" ") + "\n\n";
    }
    currentChunk += para + "\n\n";
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function removeDocument(documentId: string) {
  try {
    await deleteDocument(documentId);
    revalidatePath("/dashboard/knowledge");
    return { success: true };
  } catch (error) {
    console.error("Delete document error:", error);
    return { error: "Failed to delete document" };
  }
}
