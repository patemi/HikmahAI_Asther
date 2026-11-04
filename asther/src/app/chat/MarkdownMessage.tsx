"use client";
import { useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatIcon from "./ChatIcon";
import styles from "./Chat.module.css";
import { arabicShare } from "@/lib/citations";
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}
function CodeBlock({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className={styles.codeBlock}>
      <button
        className={styles.codeCopy}
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(ref.current?.textContent || "");
            setCopied(true);
            setFailed(false);
          } catch {
            setFailed(true);
          }
        }}
      >
        <ChatIcon name={copied ? "check" : "copy"} size={12} />
        {failed ? "Salin secara manual" : copied ? "Tersalin" : "Salin"}
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}
export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) =>
            // A paragraph that is mostly Arabic is a quoted verse: set it RTL in the Qur'an face.
            arabicShare(textOf(children)) > 0.6 ? (
              <p dir="rtl" lang="ar" className={styles.arabic}>
                {children}
              </p>
            ) : (
              <p dir="auto">{children}</p>
            ),
          img: ({ src, alt }) => (
            <span>
              {alt || "Gambar"}
              {typeof src === "string" && /^https?:\/\//i.test(src) && (
                <a href={src} target="_blank" rel="noopener noreferrer">
                  {" "}
                  (buka gambar)
                </a>
              )}
            </span>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className={styles.tableScroll}>
              <table>{children}</table>
            </div>
          ),
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
