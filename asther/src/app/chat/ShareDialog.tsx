"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import ChatDialog from "./ChatDialog";
import ChatIcon from "./ChatIcon";
import { apiError } from "./useChat";
import { sharedSnapshotSchema } from "@/lib/chat-features";
import styles from "./Chat.module.css";
const shareResult = z.object({
  shareId: z.uuid().nullable(),
  snapshot: sharedSnapshotSchema,
  preview: sharedSnapshotSchema.nullable(),
  previewDigest: z.string().nullable(),
  warning: z.string().optional(),
});
export default function ShareDialog({
  participantId,
  onClose,
}: {
  participantId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<z.infer<typeof shareResult> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const path =
    "/api/chat/conversations/" + encodeURIComponent(participantId) + "/share";
  useEffect(() => {
    const abort = new AbortController();
    void fetch(path, { cache: "no-store", signal: abort.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(await apiError(response));
        const result = shareResult.parse(await response.json());
        if (!abort.signal.aborted) setData(result);
      })
      .catch((error) => {
        if (!abort.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Pratinjau belum dapat dimuat.",
          );
      });
    return () => abort.abort();
  }, [path]);
  async function mutate(method: "POST" | "DELETE") {
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const response = await fetch(path, {
        method,
        ...(method === "POST"
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ previewDigest: data?.previewDigest }),
            }
          : {}),
      });
      if (!response.ok) throw new Error(await apiError(response));
      if (method === "DELETE")
        setData((old) => (old ? { ...old, shareId: null } : old));
      else setData(shareResult.parse(await response.json()));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Tautan belum dapat diperbarui.",
      );
    } finally {
      setBusy(false);
    }
  }
  const url =
    data?.shareId && typeof window !== "undefined"
      ? window.location.origin + "/share/" + data.shareId
      : "";
  const preview = data?.preview || data?.snapshot;
  return (
    <ChatDialog
      title="Bagikan percakapan"
      description="Siapa pun yang memiliki tautan dapat membaca salinan pesan dan kutipan sumber di bawah. Periksa data pribadi sebelum membuat tautan."
      onClose={onClose}
    >
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!data && !error && (
        <p role="status" className={styles.emptyNote}>
          Menyiapkan pratinjau…
        </p>
      )}
      {data && (
        <>
          {data.warning && (
            <p role="status" className={styles.messageNote}>
              {data.warning} Tautan yang sudah ada tetap dapat dicabut.
            </p>
          )}
          {url && data.preview && (
            <p className={styles.messageNote}>
              Pratinjau salinan terbaru. Klik Perbarui salinan untuk memperbarui
              isi tautan yang sudah ada.
            </p>
          )}
          <div className={styles.sharePreview}>
            <h3>{preview?.title}</h3>
            {preview?.messages.map((m, i) => (
              <div key={i}>
                <strong>{m.role === "user" ? "Kamu" : "Hikmah AI"}</strong>
                <p>{m.content}</p>
                {m.sources.length > 0 && (
                  <details>
                    <summary>
                      {m.sources.length} kutipan sumber ikut dibagikan
                    </summary>
                    {m.sources.map((source, n) => (
                      <div key={n}>
                        <strong>
                          [{n + 1}] {source.title} · Versi {source.version}
                        </strong>
                        <p>{source.excerpt}</p>
                        {source.source && <p>{source.source}</p>}
                      </div>
                    ))}
                  </details>
                )}
              </div>
            ))}
          </div>
          <p className={styles.messageNote}>
            Nama akun, email, dan isi lampiran berkas tidak disertakan. Isi yang
            sudah dikutip dalam jawaban tetap terlihat. Pesan baru tidak
            ditambahkan otomatis.
          </p>
          {url && (
            <div className={styles.shareLink}>
              <input
                aria-label="Tautan berbagi"
                readOnly
                value={url}
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                className={styles.primaryButton}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                  } catch {
                    setError("Pilih dan salin tautan secara manual.");
                  }
                }}
              >
                <ChatIcon name={copied ? "check" : "copy"} size={16} />
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>
          )}
          <div className={styles.modalActions}>
            {url && (
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={busy}
                onClick={() => void mutate("DELETE")}
              >
                Cabut tautan
              </button>
            )}
            <button
              type="button"
              className={styles.primaryButton}
              disabled={busy || !data.previewDigest}
              onClick={() => void mutate("POST")}
            >
              {busy
                ? "Memproses…"
                : url
                  ? "Perbarui salinan"
                  : "Buat tautan publik"}
            </button>
          </div>
        </>
      )}
    </ChatDialog>
  );
}
