export function documentMetrics(
  retrievedIds: string[],
  expectedIds?: string[] | null,
) {
  if (!expectedIds?.length)
    return { precision: null, recall: null, f1Score: null };
  const retrieved = new Set(retrievedIds);
  const expected = new Set(expectedIds);
  const hits = [...retrieved].filter((id) => expected.has(id)).length;
  const precision = retrieved.size ? hits / retrieved.size : 0;
  const recall = hits / expected.size;
  return {
    precision,
    recall,
    f1Score:
      precision + recall ? (2 * precision * recall) / (precision + recall) : 0,
  };
}
export function mean(values: Array<number | null>) {
  const measured = values.filter(
    (n): n is number => n !== null && Number.isFinite(n),
  );
  return measured.length
    ? measured.reduce((sum, n) => sum + n, 0) / measured.length
    : null;
}
export function citationNumbersValid(response: string, count: number) {
  const numbers = [...response.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
  return numbers.length > 0 && numbers.every((n) => n >= 1 && n <= count);
}
