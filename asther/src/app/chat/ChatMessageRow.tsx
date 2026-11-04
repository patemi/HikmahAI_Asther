"use client";
import { useState } from "react";
import type { ChatMessage } from "@/lib/chat-contract";
import type { ChatAttachment } from "@/lib/chat-features";
import ChatIcon from "./ChatIcon";
import MarkdownMessage from "./MarkdownMessage";
import styles from "./Chat.module.css";
type Props = {
  message: ChatMessage;
  pending: boolean;
  busy: boolean;
  temporary: boolean;
  canRegenerate: boolean;
  last: boolean;
  reading: boolean;
  onCopy: () => void;
  copied: boolean;
  onSources: () => void;
  onReport: () => void;
  onRegenerate: () => void;
  onRead: () => void;
  onFeedback: (value: "up" | "down" | null) => void;
  onEdit: (text: string, attachments: ChatAttachment[]) => Promise<void>;
};
export default function ChatMessageRow(props: Props) {
  const { message } = props;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(message.content);
  if (message.role === "user")
    return (
      <article className={styles.userMessage} aria-label="Pesanmu">
        {editing ? (
          <form
            className={styles.editMessage}
            onSubmit={(event) => {
              event.preventDefault();
              if (!text.trim()) return;
              setEditing(false);
              void props.onEdit(text.trim(), message.attachments);
            }}
          >
            <label className={styles.srOnly} htmlFor={"edit-" + message.id}>
              Edit pertanyaan
            </label>
            <textarea
              id={"edit-" + message.id}
              value={text}
              autoFocus
              rows={4}
              maxLength={8000}
              onChange={(event) => setText(event.target.value)}
            />
            <p>
              Perubahan membuka cabang baru. Percakapan asli tetap tersimpan.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setEditing(false)}
              >
                Batal
              </button>
              <button className={styles.primaryButton} disabled={!text.trim()}>
                Kirim perubahan
              </button>
            </div>
          </form>
        ) : (
          <>
            {message.attachments.map((file, i) => (
              <div className={styles.messageAttachment} key={i}>
                <ChatIcon name="file" size={22} />
                <div>
                  <strong>{file.name}</strong>
                  <span>Berkas teks</span>
                </div>
              </div>
            ))}
            <div className={styles.userBubble} dir="auto">
              {message.content}
            </div>
            <div className={styles.userActions}>
              <button
                className={styles.actionButton}
                type="button"
                aria-label={props.copied ? "Tersalin" : "Salin pertanyaan"}
                title="Salin pertanyaan"
                onClick={props.onCopy}
              >
                <ChatIcon name={props.copied ? "check" : "copy"} size={16} />
              </button>
              {!props.temporary && !message.id.startsWith("pending-") && (
                <button
                  className={styles.actionButton}
                  type="button"
                  aria-label="Edit pertanyaan"
                  title="Edit pertanyaan"
                  disabled={props.busy}
                  onClick={() => {
                    setText(message.content);
                    setEditing(true);
                  }}
                >
                  <ChatIcon name="edit" size={16} />
                </button>
              )}
            </div>
          </>
        )}
      </article>
    );
  return (
    <article
      className={styles.assistantMessage}
      aria-label="Jawaban Hikmah AI"
      aria-busy={props.pending}
    >
      {message.content ? (
        <MarkdownMessage content={message.content} />
      ) : (
        <div className={styles.thinking} role="status">
          <span className={styles.thinkingDots} aria-hidden>
            <span className={styles.thinkingDot} />
            <span className={styles.thinkingDot} />
            <span className={styles.thinkingDot} />
          </span>
          <span>Menyiapkan jawaban…</span>
        </div>
      )}
      {message.provenance?.status === "stopped" &&
        message.content !== "Respons dihentikan." && (
          <p className={styles.messageNote}>Respons dihentikan</p>
        )}
      {message.citationNotice && message.provenance?.model && (
        <p className={styles.messageNote}>{message.citationNotice}</p>
      )}
      {!props.pending && message.content && (
        <div className={styles.messageActions}>
          <button
            type="button"
            className={styles.actionButton}
            aria-label={props.copied ? "Tersalin" : "Salin jawaban"}
            title="Salin jawaban"
            onClick={props.onCopy}
          >
            <ChatIcon name={props.copied ? "check" : "copy"} size={17} />
          </button>
          {!props.temporary && !message.id.startsWith("pending-") && (
            <>
              <button
                type="button"
                className={styles.actionButton}
                aria-label="Jawaban membantu"
                aria-pressed={message.feedback === "up"}
                title="Jawaban membantu"
                onClick={() =>
                  props.onFeedback(message.feedback === "up" ? null : "up")
                }
              >
                <ChatIcon name="thumbUp" size={17} />
              </button>
              <button
                type="button"
                className={styles.actionButton}
                aria-label="Jawaban kurang membantu"
                aria-pressed={message.feedback === "down"}
                title="Jawaban kurang membantu"
                onClick={() =>
                  props.onFeedback(message.feedback === "down" ? null : "down")
                }
              >
                <ChatIcon name="thumbDown" size={17} />
              </button>
            </>
          )}
          <button
            type="button"
            className={styles.actionButton}
            aria-label={props.reading ? "Hentikan pembacaan" : "Baca jawaban"}
            title={props.reading ? "Hentikan pembacaan" : "Baca jawaban"}
            onClick={props.onRead}
          >
            <ChatIcon name={props.reading ? "stop" : "volume"} size={17} />
          </button>
          {props.last && props.canRegenerate && (
            <button
              type="button"
              className={styles.actionButton}
              aria-label="Buat ulang jawaban"
              title="Buat ulang jawaban"
              disabled={props.busy}
              onClick={props.onRegenerate}
            >
              <ChatIcon name="refresh" size={17} />
            </button>
          )}
          {message.citations.length > 0 && (
            <button
              type="button"
              className={styles.sourceButton}
              onClick={props.onSources}
            >
              <ChatIcon name="book" size={14} />
              {message.citations.length} sumber
            </button>
          )}
          {!props.temporary && !message.id.startsWith("pending-") && (
            <details className={styles.messageMore}>
              <summary
                aria-label="Tindakan jawaban lainnya"
                title="Tindakan lainnya"
              >
                <ChatIcon name="more" size={18} />
              </summary>
              <div className={styles.rowMenu}>
                <button
                  type="button"
                  onClick={(event) => {
                    event.currentTarget
                      .closest("details")
                      ?.removeAttribute("open");
                    props.onReport();
                  }}
                >
                  <ChatIcon name="flag" size={15} />
                  Laporkan jawaban
                </button>
              </div>
            </details>
          )}
        </div>
      )}
    </article>
  );
}
