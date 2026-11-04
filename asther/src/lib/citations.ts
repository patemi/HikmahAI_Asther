import { z } from "zod";

export const PROMPT_VERSION = "hikmah-2026-11-dalil-v4";
export const citationSchema = z.object({
  chunkId: z.string().uuid(),
  documentId: z.string().uuid(),
  title: z.string(),
  source: z.string().nullable(),
  author: z.string().nullable(),
  locator: z.string().nullable(),
  version: z.number().int().positive(),
  excerpt: z.string(),
  score: z.number().min(0).max(1),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
});
export type Citation = z.infer<typeof citationSchema>;
export type AnswerStatus =
  | "answered"
  | "insufficient_sources"
  | "out_of_scope"
  | "stopped"
  | "error";
export type AnswerProvenance = {
  promptVersion: string;
  model: string | null;
  status: AnswerStatus;
  responseDepth: "ringkas" | "standar" | "mendalam";
  guardrailLevel: string;
};

/** Share of non-space characters that are Arabic script, 0..1. */
export function arabicShare(text: string) {
  const letters = text.replace(/\s/g, "");
  if (!letters) return 0;
  return (letters.match(/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g)?.length ?? 0) / letters.length;
}

/**
 * Splits a citation excerpt into Arabic text, its meaning and a note.
 * Ayah excerpts look like "QS …\n<arab>\nArtinya: …\nCatatan: …"; older ones
 * also carry a transliteration line, which is dropped. Anything else (hadith
 * translations, surah notes) is returned as plain `text`.
 */
export function readDalil(excerpt: string) {
  const arabic: string[] = [];
  const text: string[] = [];
  let meaning = "";
  let note = "";
  for (const raw of excerpt.split("\n")) {
    const line = raw.trim();
    if (!line || /^QS .+\]: \d+$/.test(line)) continue;
    if (arabicShare(line) > 0.6) arabic.push(line);
    else if (/^Artinya:/i.test(line)) meaning = line.replace(/^Artinya:\s*/i, "");
    else if (/^Catatan( kaki)?:/i.test(line))
      note = line.replace(/^Catatan( kaki)?:\s*/i, "");
    // Transliteration (macron letters) only ever sits before the meaning.
    else if (!meaning && /[āīūḥṣḍṭẓ]/.test(line)) continue;
    else text.push(line);
  }
  return { arabic: arabic.join("\n"), meaning, note, text: text.join("\n") };
}

export function safeSourceUrl(
  source: string | null | undefined,
): string | null {
  if (!source) return null;
  try {
    const url = new URL(source);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
