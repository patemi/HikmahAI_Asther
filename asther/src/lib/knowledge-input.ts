import { z } from "zod";
export const documentInputSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(300),
  content: z.string().trim().min(1, "Isi dokumen wajib diisi.").max(200_000),
  source: z.string().trim().max(2000).optional(),
  author: z.string().trim().max(300).optional(),
  locator: z.string().trim().max(300).optional(),
});
export function parseKnowledgeJson(raw: string, fallbackTitle: string) {
  const parsed: unknown = JSON.parse(raw);
  const wrapper =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  const items = Array.isArray(parsed)
    ? parsed
    : Array.isArray(wrapper?.documents)
      ? wrapper.documents
      : Array.isArray(wrapper?.items)
        ? wrapper.items
        : Array.isArray(wrapper?.data)
          ? wrapper.data
          : [parsed];
  if (items.length > 100) throw new Error("Maksimal 100 dokumen per impor.");
  return items.map((item, i) => {
    const value: Record<string, unknown> =
      item && typeof item === "object" && !Array.isArray(item)
        ? (item as Record<string, unknown>)
        : { content: item };
    const result = documentInputSchema.safeParse({
      title: value.title || value.name || fallbackTitle + " #" + (i + 1),
      content: value.content ?? value.text ?? value.body ?? value.description,
      source: value.source ?? value.url ?? value.link,
      author: value.author,
      locator: value.locator,
    });
    if (!result.success)
      throw new Error(
        "Dokumen #" + (i + 1) + ": " + result.error.issues[0].message,
      );
    return result.data;
  });
}
