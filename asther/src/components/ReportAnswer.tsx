"use client";
import { useId, useState } from "react";
import ChatDialog from "@/app/chat/ChatDialog";
import styles from "@/app/chat/Chat.module.css";
export default function ReportAnswer({
  messageId,
  onClose,
}: {
  messageId: string;
  onClose: () => void;
}) {
  const reasonId = useId();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          reason: form.get("reason"),
          details: form.get("details"),
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Laporan belum terkirim.",
        );
      setStatus("sent");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Laporan belum terkirim.",
      );
      setStatus("idle");
    }
  }
  return (
    <ChatDialog
      title={
        status === "sent" ? "Terima kasih atas laporannya" : "Laporkan jawaban"
      }
      description={
        status === "sent"
          ? "Pengelola akan memeriksa jawaban dan rujukan yang kamu laporkan."
          : "Bantu kami memperbaiki penjelasan yang kurang tepat."
      }
      onClose={onClose}
    >
      {status === "sent" ? (
        <div>
          <p role="status" className={styles.messageNote}>
            Laporan diterima untuk ditinjau pengelola.
          </p>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onClose}
            >
              Selesai
            </button>
          </div>
        </div>
      ) : (
        <form action={submit}>
          <div className={styles.formLabel}>
            <label htmlFor={reasonId}>Alasan</label>
            <select
              id={reasonId}
              name="reason"
              className={styles.formField}
              required
            >
              <option value="incorrect">Isi atau dalil keliru</option>
              <option value="citation">Sumber tidak sesuai</option>
              <option value="unclear">Penjelasan membingungkan</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          <label className={styles.formLabel}>
            Keterangan (opsional)
            <textarea
              name="details"
              maxLength={2000}
              rows={4}
              className={styles.formField}
              placeholder="Sebutkan bagian yang perlu diperiksa. Hindari data pribadi."
            />
          </label>
          <p className={styles.messageNote}>
            Pertanyaan, jawaban, dan referensinya disertakan agar pengelola
            dapat memeriksanya.
          </p>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
            >
              Batal
            </button>
            <button
              disabled={status === "sending"}
              className={styles.primaryButton}
            >
              {status === "sending" ? "Mengirim..." : "Kirim laporan"}
            </button>
          </div>
        </form>
      )}
    </ChatDialog>
  );
}
