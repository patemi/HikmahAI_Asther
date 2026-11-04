export type ScoredChunk = {
  id: string;
  vectorScore: number;
  keywordScore: number;
  documentTitle: string;
  source?: string | null;
  content: string;
};
export function rankKnowledge<T extends ScoredChunk>(
  query: string,
  candidates: T[],
  minScore: number,
  topK: number,
) {
  const quran = /(qur'?an|surah|ayat|tafsir)/i.test(query);
  const hadith = /(hadits?|hadis|bukhari|muslim|riwayat)/i.test(query);
  const unique = new Map<string, T>();
  for (const row of candidates) {
    const current = unique.get(row.id);
    if (!current) unique.set(row.id, { ...row });
    else
      unique.set(row.id, {
        ...current,
        vectorScore: Math.max(current.vectorScore, row.vectorScore),
        keywordScore: Math.max(current.keywordScore, row.keywordScore),
      });
  }
  return [...unique.values()]
    .map((row) => {
      const similarity = Math.max(
        0,
        Math.min(
          1,
          Math.max(Number(row.vectorScore), Number(row.keywordScore)),
        ),
      );
      const text =
        row.documentTitle + " " + (row.source || "") + " " + row.content;
      const boost =
        (quran && /(qur'?an|surah|ayat|tafsir)/i.test(text)) ||
        (hadith && /(hadits?|hadis|riwayat)/i.test(text))
          ? 0.05
          : 0;
      return {
        ...row,
        similarity,
        rank:
          0.75 * Number(row.vectorScore) +
          0.25 * Number(row.keywordScore) +
          boost,
      };
    })
    .filter(
      (row) => Number.isFinite(row.similarity) && row.similarity >= minScore,
    )
    .sort((a, b) => b.rank - a.rank)
    .slice(0, topK);
}
