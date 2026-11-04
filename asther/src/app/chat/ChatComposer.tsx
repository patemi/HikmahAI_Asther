"use client";
import { useRef, useState, type RefObject } from "react";
import { attachmentsSchema, type ChatAttachment } from "@/lib/chat-features";
import ChatIcon from "./ChatIcon";
import styles from "./Chat.module.css";
type Props = {
  value: string;
  onChange: (text: string) => void;
  onSend: (text: string, files: ChatAttachment[]) => Promise<void>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  busy: boolean;
  stopping: boolean;
  loading: boolean;
  onStop: () => void;
  listening: boolean;
  onDictate: () => void;
  canDictate: boolean;
  onError: (text: string) => void;
  temporary: boolean;
};
export default function ChatComposer(props: Props) {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  async function addFiles(files: File[]) {
    if (reading || props.busy) return;
    setReading(true);
    try {
      if (files.length + attachments.length > 3)
        throw new Error("Maksimal 3 berkas dalam satu pesan.");
      const additions: ChatAttachment[] = [];
      for (const file of files) {
        if (!/\.(txt|md)$/i.test(file.name))
          throw new Error(
            "Gunakan berkas .txt atau .md. Format lain belum didukung.",
          );
        if (file.size > 64_000)
          throw new Error("Berkas maksimal 64 KB dan 16.000 karakter.");
        let content: string;
        try {
          content = new TextDecoder("utf-8", { fatal: true }).decode(
            await file.arrayBuffer(),
          );
        } catch {
          throw new Error("Berkas harus berupa teks UTF-8.");
        }
        additions.push({ name: file.name, content });
      }
      const parsed = attachmentsSchema.safeParse([
        ...attachments,
        ...additions,
      ]);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      setAttachments(parsed.data);
    } catch (error) {
      props.onError(
        error instanceof Error ? error.message : "Berkas belum dapat dibaca.",
      );
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function submit() {
    if (
      !props.value.trim() ||
      props.busy ||
      props.loading ||
      reading ||
      props.listening
    )
      return;
    const text = props.value.trim();
    const files = attachments;
    props.onChange("");
    setAttachments([]);
    if (props.textareaRef.current)
      props.textareaRef.current.style.height = "auto";
    await props.onSend(text, files);
  }
  return (
    <form
      className={styles.composer + (dragging ? " " + styles.dragging : "")}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void addFiles(Array.from(event.dataTransfer.files));
      }}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {attachments.length > 0 && (
        <div className={styles.attachments}>
          {attachments.map((file, i) => (
            <div className={styles.attachment} key={file.name + i}>
              <ChatIcon name="file" size={22} />
              <div>
                <strong>{file.name}</strong>
                <span>
                  Berkas teks · {file.content.length.toLocaleString("id-ID")}{" "}
                  karakter
                </span>
              </div>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={"Hapus lampiran " + file.name}
                onClick={() =>
                  setAttachments((items) => items.filter((_, n) => n !== i))
                }
              >
                <ChatIcon name="close" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <label htmlFor="hikmah-composer" className={styles.srOnly}>
        Pertanyaan keislaman
      </label>
      <textarea
        id="hikmah-composer"
        ref={props.textareaRef}
        value={props.value}
        rows={1}
        maxLength={8000}
        placeholder={
          props.temporary
            ? "Tanya apa aja, chat ini tidak disimpan…"
            : "Tanya apa aja…"
        }
        disabled={props.loading || props.stopping}
        onChange={(event) => {
          props.onChange(event.target.value);
          event.target.style.height = "auto";
          event.target.style.height =
            Math.min(event.target.scrollHeight, 200) + "px";
        }}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            void submit();
          }
        }}
      />
      <div className={styles.composerBottom}>
        <div className={styles.composerTools}>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            multiple
            hidden
            aria-label="Pilih berkas teks"
            onChange={(event) =>
              void addFiles(Array.from(event.target.files || []))
            }
          />
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Tambahkan berkas teks"
            title="Lampirkan .txt atau .md (maks. 3 berkas)"
            disabled={props.busy || reading}
            onClick={() => fileRef.current?.click()}
          >
            <ChatIcon name="plus" size={22} />
          </button>
          <span className={styles.composerHint}>
            {reading
              ? "Membaca berkas..."
              : attachments.length
                ? "Tambahkan pertanyaan soal berkasmu"
                : "Hikmah AI"}
          </span>
        </div>
        <div className={styles.composerTools}>
          {props.canDictate && (
            <button
              type="button"
              className={
                styles.iconButton +
                (props.listening ? " " + styles.recording : "")
              }
              aria-label={
                props.listening ? "Hentikan dikte" : "Dikte pertanyaan"
              }
              title="Dikte diproses oleh layanan suara browser"
              onClick={props.onDictate}
              disabled={props.busy || reading}
            >
              <ChatIcon name={props.listening ? "stop" : "mic"} size={20} />
            </button>
          )}
          {props.busy ? (
            <button
              type="button"
              className={styles.sendButton}
              aria-label="Hentikan respons"
              disabled={props.stopping}
              onClick={props.onStop}
            >
              <ChatIcon name="stop" size={18} />
            </button>
          ) : (
            <button
              className={styles.sendButton}
              type="submit"
              aria-label="Kirim pertanyaan"
              disabled={
                !props.value.trim() ||
                props.loading ||
                reading ||
                props.listening
              }
            >
              <ChatIcon name="send" size={20} />
            </button>
          )}
        </div>
      </div>
      {props.listening && (
        <p role="status" className={styles.dictationStatus}>
          Mendengarkan… Audio diproses oleh layanan suara browser.
        </p>
      )}
    </form>
  );
}
