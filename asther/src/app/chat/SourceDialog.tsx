import type { Citation } from "@/lib/citations";
import { readDalil, safeSourceUrl } from "@/lib/citations";
import ChatDialog from "./ChatDialog";
import styles from "./Chat.module.css";
export default function SourceDialog({
  sources,
  onClose,
}: {
  sources: Citation[];
  onClose: () => void;
}) {
  return (
    <ChatDialog
      title="Rujukan jawaban"
      description="Ayat dan hadis yang dipakai untuk menyusun jawaban ini."
      drawer
      onClose={onClose}
    >
      {sources.map((source, index) => {
        const dalil = readDalil(source.excerpt);
        return (
          <article key={source.chunkId} className={styles.source}>
            <p className={styles.sourceLabel}>
              Sumber {String(index + 1).padStart(2, "0")}
            </p>
            <h3>
              [{index + 1}] {source.title}
            </h3>
            {dalil.arabic && (
              <p dir="rtl" lang="ar" className={styles.sourceArabic}>
                {dalil.arabic}
              </p>
            )}
            {dalil.meaning && (
              <p className={styles.sourceMeaning}>
                <strong>Artinya:</strong> {dalil.meaning}
              </p>
            )}
            {dalil.text && <blockquote dir="auto">{dalil.text}</blockquote>}
            {dalil.note && (
              <p className={styles.sourceNote}>Catatan: {dalil.note}</p>
            )}
            <p className={styles.sourceMeta}>
              {[source.locator, source.source].filter(Boolean).join(" · ")}
            </p>
            {source.source && safeSourceUrl(source.source) && (
              <a
                href={safeSourceUrl(source.source)!}
                className={styles.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka sumber asli ↗
              </a>
            )}
          </article>
        );
      })}
    </ChatDialog>
  );
}
