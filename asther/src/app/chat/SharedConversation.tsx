"use client";
import Link from "next/link";
import type { SharedSnapshot } from "@/lib/chat-features";
import { safeSourceUrl } from "@/lib/citations";
import { useChatTheme } from "./useChatTheme";
import MarkdownMessage from "./MarkdownMessage";
import ChatIcon from "./ChatIcon";
import BrandLogo from "@/components/BrandLogo";
import styles from "./Chat.module.css";
export default function SharedConversation({
  snapshot,
}: {
  snapshot: SharedSnapshot;
}) {
  const { dark, toggle } = useChatTheme();
  return (
    <div
      className={styles.workspace + " " + styles.sharedWorkspace}
      data-theme={dark ? "dark" : "light"}
    >
      <header className={styles.header}>
        <Link href="/" className={styles.headerBrand} aria-label="Hikmah AI">
          <BrandLogo size={26} wordmarkClassName="text-xl" />
        </Link>
        <div className={styles.headerEnd}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={dark ? "Gunakan tema terang" : "Gunakan tema gelap"}
            onClick={toggle}
          >
            <ChatIcon name={dark ? "sun" : "moon"} />
          </button>
          <a href="/chat" className={styles.primaryButton}>
            Mulai chat
          </a>
        </div>
      </header>
      <main className={styles.sharedMain}>
        <h1>{snapshot.title}</h1>
        <p className={styles.sharedNote}>
          Salinan percakapan yang dibagikan pengguna ·{" "}
          {new Date(snapshot.sharedAt).toLocaleDateString("id-ID", {
            timeZone: "Asia/Jakarta",
          })}
        </p>
        <div className={styles.messages}>
          {snapshot.messages.map((message, i) => (
            <article
              key={i}
              className={
                message.role === "user"
                  ? styles.userMessage
                  : styles.assistantMessage
              }
              aria-label={
                message.role === "user" ? "Pertanyaan" : "Jawaban Hikmah AI"
              }
            >
              {message.role === "user" ? (
                <div className={styles.userBubble} dir="auto">
                  {message.content}
                </div>
              ) : (
                <>
                  <MarkdownMessage content={message.content} />
                  {message.sources.length > 0 && (
                    <details className={styles.sharedSources}>
                      <summary>{message.sources.length} sumber</summary>
                      {message.sources.map((source, n) => (
                        <div key={n}>
                          <strong>
                            [{n + 1}] {source.title} · Versi {source.version}
                          </strong>
                          <blockquote dir="auto">{source.excerpt}</blockquote>
                          {safeSourceUrl(source.source) && (
                            <a
                              href={safeSourceUrl(source.source)!}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Buka sumber asli ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </details>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
        <p className={styles.disclaimer}>
          Hikmah AI dapat keliru. Periksa rujukan dan konteks sebelum menggunakan
          jawaban.
        </p>
      </main>
    </div>
  );
}
