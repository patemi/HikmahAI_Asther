import { safeSourceUrl, type Citation } from "@/lib/citations";
export default function AnswerSources({
  citations,
}: {
  citations: Citation[];
}) {
  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <p className="text-xs font-medium text-[#b3d7c7]">
        Rujukan hasil pencarian
      </p>
      <p className="mt-1 text-[11px] text-[#8bb5a2]">
        Skor menunjukkan kemiripan pencarian, bukan tingkat kebenaran jawaban.
      </p>
      <ol className="mt-2 space-y-2">
        {citations.map((citation, index) => (
          <li key={citation.chunkId}>
            <details className="rounded-lg border border-white/10 p-3">
              <summary className="cursor-pointer text-xs text-[#d3ebe1] focus-visible:outline-2 focus-visible:outline-emerald-400">
                [{index + 1}] {citation.title}{" "}
                <span className="text-[#9cc9b7]">
                  · Kemiripan {Math.round(citation.score * 100)}%
                </span>
              </summary>
              <blockquote className="my-3 border-l-2 border-emerald-400/40 pl-3 text-sm leading-relaxed text-[#c7e9dc] whitespace-pre-wrap">
                {citation.excerpt}
              </blockquote>
              <p className="text-xs text-[#9cc9b7]">
                {[
                  citation.author,
                  citation.locator,
                  "Versi " + citation.version,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {citation.source &&
                (safeSourceUrl(citation.source) ? (
                  <a
                    href={safeSourceUrl(citation.source)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all text-xs text-emerald-300 underline underline-offset-4"
                  >
                    Buka sumber asli
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-[#9cc9b7]">
                    {citation.source}
                  </p>
                ))}
              {citation.reviewedBy && (
                <p className="mt-2 text-[11px] text-[#8bb5a2]">
                  Ditinjau {citation.reviewedBy}
                  {citation.reviewedAt
                    ? " · " +
                      new Date(citation.reviewedAt).toLocaleDateString(
                        "id-ID",
                        { timeZone: "Asia/Jakarta" },
                      )
                    : ""}
                </p>
              )}
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
