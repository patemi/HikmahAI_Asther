import { NextResponse } from "next/server";
import { addDocument } from "@/lib/rag";
import { getSession } from "@/lib/auth";
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
      .map((item, index) => toParsedDocument(item, `${fallbackTitle} #${index + 1}`))
      .filter((doc): doc is ParsedDocument => Boolean(doc));
  }

  if (parsed && typeof parsed === "object") {
    const objectParsed = parsed as Record<string, unknown>;

    if (Array.isArray(objectParsed.documents)) {
      return objectParsed.documents
        .map((item, index) => toParsedDocument(item, `${fallbackTitle} #${index + 1}`))
        .filter((doc): doc is ParsedDocument => Boolean(doc));
    }

    if (Array.isArray(objectParsed.items)) {
      return objectParsed.items
        .map((item, index) => toParsedDocument(item, `${fallbackTitle} #${index + 1}`))
        .filter((doc): doc is ParsedDocument => Boolean(doc));
    }

    if (Array.isArray(objectParsed.data)) {
      return objectParsed.data
        .map((item, index) => toParsedDocument(item, `${fallbackTitle} #${index + 1}`))
        .filter((doc): doc is ParsedDocument => Boolean(doc));
    }

    const singleDoc = toParsedDocument(objectParsed, fallbackTitle);
    return singleDoc ? [singleDoc] : [];
  }

  return [];
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData
      .getAll("jsonFiles")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one JSON file" },
        { status: 400 }
      );
    }

    let importedCount = 0;

    for (const jsonFile of files) {
      if (!jsonFile.name.toLowerCase().endsWith(".json")) {
        return NextResponse.json(
          { error: `Only .json files are supported (invalid: ${jsonFile.name})` },
          { status: 400 }
        );
      }

      const raw = await jsonFile.text();
      let parsedDocs: ParsedDocument[];

      try {
        const fallbackTitle =
          jsonFile.name.replace(/\.json$/i, "") || "Uploaded JSON Document";
        parsedDocs = parseKnowledgeJson(raw, fallbackTitle);
      } catch {
        return NextResponse.json(
          { error: `Invalid JSON format in file: ${jsonFile.name}` },
          { status: 400 }
        );
      }

      if (parsedDocs.length === 0) {
        return NextResponse.json(
          {
            error: `No valid documents found in ${jsonFile.name}. JSON does not contain importable content.`,
          },
          { status: 400 }
        );
      }

      for (const doc of parsedDocs) {
        await addDocument(doc.title, doc.content, doc.source, doc.metadata);
        importedCount++;
      }
    }

    revalidatePath("/dashboard/knowledge");
    revalidatePath("/dashboard/knowledge/upload");

    return NextResponse.json({
      success: true,
      importedCount,
      fileCount: files.length,
    });
  } catch (error) {
    console.error("Import JSON documents error:", error);
    return NextResponse.json(
      { error: "Failed to import JSON documents" },
      { status: 500 }
    );
  }
}
