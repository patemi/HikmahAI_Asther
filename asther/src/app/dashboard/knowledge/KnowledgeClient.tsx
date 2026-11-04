"use client";
import Link from "next/link";
import { useState } from "react";
import {
  createDocument,
  getDocument,
  updateDocument,
  removeDocument,
  reviewDocument,
} from "@/app/actions/knowledge";
import EmbeddingPanel from "./EmbeddingPanel";
import type { KnowledgeDocument } from "@/lib/db/schema";
import { safeSourceUrl } from "@/lib/citations";

export type KnowledgeStatus = KnowledgeDocument["status"];
export type KnowledgeListItem = Pick<
  KnowledgeDocument,
  | "id"
  | "title"
  | "source"
  | "author"
  | "locator"
  | "status"
  | "version"
  | "reviewedBy"
  | "reviewedAt"
> & { preview: string; contentLength: number };
type Filter = { q: string; status: KnowledgeStatus | null; page: number };

function listHref(filter: Filter, patch: Partial<Filter>) {
  const next = { ...filter, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.status) params.set("status", next.status);
  if (next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return "/dashboard/knowledge" + (query ? "?" + query : "");
}

/** Full text is fetched the first time the panel is opened. */
function DocumentContent({ doc }: { doc: KnowledgeListItem }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState("");
  const truncated = doc.contentLength > doc.preview.length;
  return (
    <details
      className="mt-3 text-sm"
      onToggle={(event) => {
        if (!event.currentTarget.open || content !== null || !truncated) return;
        getDocument(doc.id)
          .then((result) =>
            result.document
              ? setContent(result.document.content)
              : setError(result.error || ""),
          )
          .catch(() => setError("Isi dokumen belum dapat dimuat."));
      }}
    >
      <summary className="cursor-pointer text-stone-700">
        Periksa isi dan identitas dokumen
      </summary>
      <p className="mt-2 whitespace-pre-wrap leading-relaxed">
        {content ?? doc.preview}
        {content === null && truncated && (
          <span className="text-stone-500"> … memuat isi lengkap</span>
        )}
      </p>
      {error && <p className="mt-2 text-red-700">{error}</p>}
      <p className="mt-3 break-all text-xs text-stone-500">
        ID dokumen: {doc.id} · {doc.contentLength.toLocaleString("id-ID")}{" "}
        karakter
      </p>
    </details>
  );
}

const field =
  "mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-2 focus-visible:outline-primary";
const button =
  "rounded-md border border-stone-300 px-3 py-2 text-sm disabled:opacity-50";
const statusLabels = {
  draft: "Draft",
  review: "Dalam tinjauan",
  published: "Terbit",
};
function DocumentFields({ doc }: { doc?: KnowledgeDocument }) {
  return (
    <div className="space-y-4">
      {doc && (
        <>
          <input type="hidden" name="documentId" value={doc.id} />
          <input type="hidden" name="version" value={doc.version} />
        </>
      )}
      <label className="block text-sm font-medium">
        Judul
        <input
          name="title"
          required
          maxLength={300}
          defaultValue={doc?.title}
          className={field}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Identitas sumber / URL
          <input
            name="source"
            maxLength={2000}
            defaultValue={doc?.source || ""}
            className={field}
            placeholder="Nama kitab, penerbit, atau URL sumber"
          />
        </label>
        <label className="block text-sm">
          Penulis / lembaga
          <input
            name="author"
            maxLength={300}
            defaultValue={doc?.author || ""}
            className={field}
          />
        </label>
      </div>
      <label className="block text-sm">
        Lokasi rujukan
        <input
          name="locator"
          maxLength={300}
          defaultValue={doc?.locator || ""}
          className={field}
          placeholder="Surah dan ayat, nomor hadis, bab, edisi / halaman"
        />
      </label>
      <label className="block text-sm font-medium">
        Isi dokumen
        <textarea
          name="content"
          required
          maxLength={200000}
          rows={12}
          defaultValue={doc?.content}
          className={field}
        />
      </label>
      <p className="text-xs leading-relaxed text-stone-600">
        Dokumen baru disimpan sebagai draft. Mengubah isi atau identitas sumber
        membuat versi baru dan memerlukan tinjauan ulang. Hanya dokumen terbit
        yang digunakan untuk menjawab.
      </p>
    </div>
  );
}
export default function KnowledgeClient({
  documents,
  totals,
  filter,
  hasNext,
}: {
  documents: KnowledgeListItem[];
  totals: Record<KnowledgeStatus, number>;
  filter: Filter;
  hasNext: boolean;
}) {
  const totalAll = totals.draft + totals.review + totals.published;
  const [editing, setEditing] = useState<KnowledgeDocument | "new" | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function run(
    action: () => Promise<{ error?: string; message?: string }>,
    close = false,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const result = await action();
      setMessage(result.error || result.message || "Perubahan tersimpan.");
      if (!result.error && close) setEditing(null);
    } catch {
      setMessage(
        "Perubahan belum tersimpan. Cek koneksi dan hak aksesmu.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function openEditor(id: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await getDocument(id);
      if (result.document) setEditing(result.document);
      else setMessage(result.error || "Dokumen belum dapat dibuka.");
    } catch {
      setMessage("Dokumen belum dapat dibuka. Cek koneksi dan hak aksesmu.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-none">Basis pengetahuan</h1>
          <p className="mt-1 text-sm text-stone-600">
            Kurasi sumber, periksa kutipannya, lalu terbitkan untuk digunakan
            dalam jawaban.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/knowledge/upload" className={button}>
            Impor JSON
          </Link>
          <button
            disabled={busy}
            className="rounded-md bg-primary px-4 py-2 text-sm text-on-primary font-bold"
            onClick={() => setEditing(editing ? null : "new")}
          >
            {editing ? "Tutup formulir" : "Tambah dokumen"}
          </button>
        </div>
      </div>
      <EmbeddingPanel />
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-stone-200 py-3">
        <nav aria-label="Status dokumen" className="flex flex-wrap gap-2 text-sm">
          {(
            [
              [null, "Semua", totalAll],
              ["published", statusLabels.published, totals.published],
              ["review", statusLabels.review, totals.review],
              ["draft", statusLabels.draft, totals.draft],
            ] as const
          ).map(([value, label, count]) => (
            <Link
              key={label}
              href={listHref(filter, { status: value, page: 1 })}
              aria-current={filter.status === value ? "page" : undefined}
              className={
                "rounded-full px-3 py-1.5 " +
                (filter.status === value
                  ? "bg-primary font-semibold text-on-primary"
                  : "text-stone-600 hover:bg-stone-100")
              }
            >
              {label} · {count.toLocaleString("id-ID")}
            </Link>
          ))}
        </nav>
        <form action="/dashboard/knowledge" className="flex gap-2">
          {filter.status && (
            <input type="hidden" name="status" value={filter.status} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={filter.q}
            maxLength={200}
            placeholder="Cari judul, sumber, atau lokasi"
            aria-label="Cari dokumen"
            className={field + " mt-0 w-64"}
          />
          <button className={button}>Cari</button>
        </form>
      </div>
      {message && (
        <p
          role="status"
          className="rounded-md border border-stone-200 bg-white p-3 text-sm"
        >
          {message}
        </p>
      )}
      {editing && (
        <form
          key={editing === "new" ? "new" : editing.id}
          action={(form) =>
            run(
              () =>
                editing === "new" ? createDocument(form) : updateDocument(form),
              true,
            )
          }
          className="space-y-5 border border-stone-200 bg-white p-5"
        >
          <h2 className="font-heading">
            {editing === "new" ? "Tambah draft" : "Perbarui dokumen"}
          </h2>
          <DocumentFields doc={editing === "new" ? undefined : editing} />
          <button
            disabled={busy}
            className="rounded-md bg-primary px-4 py-2 text-sm text-on-primary font-bold disabled:opacity-50"
          >
            {busy ? "Mengindeks..." : "Simpan sebagai draft"}
          </button>
        </form>
      )}
      {!documents.length && (
        <p className="py-12 text-center text-sm text-stone-600">
          {totalAll
            ? "Tidak ada dokumen yang cocok dengan filter ini."
            : "Belum ada dokumen. Tambahkan teks atau impor JSON untuk memulai kurasi."}
        </p>
      )}
      <div className="divide-y divide-stone-200">
        {documents.map((doc) => (
          <article key={doc.id} className="py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-stone-500">
                  {statusLabels[doc.status]} · Versi {doc.version}
                </p>
                <h2 className="mt-1 font-heading">{doc.title}</h2>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  className={button}
                  onClick={() => void openEditor(doc.id)}
                >
                  Edit
                </button>
                <button
                  disabled={busy}
                  className={button + " text-red-700"}
                  onClick={() => {
                    if (
                      confirm(
                        "Hapus dokumen ini? Kutipan yang tersimpan pada jawaban lama tetap tersedia.",
                      )
                    )
                      void run(() => removeDocument(doc.id));
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-stone-600">
              {[doc.author, doc.locator].filter(Boolean).join(" · ")}
            </p>
            {doc.source &&
              (safeSourceUrl(doc.source) ? (
                <a
                  className="mt-1 block break-all text-sm text-emerald-800 underline underline-offset-4"
                  href={safeSourceUrl(doc.source)!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {doc.source}
                </a>
              ) : (
                <p className="mt-1 text-sm text-stone-600">{doc.source}</p>
              ))}
            <DocumentContent doc={doc} />
            {doc.reviewedBy && (
              <p className="mt-3 text-xs text-emerald-800">
                Ditinjau oleh {doc.reviewedBy}
                {doc.reviewedAt
                  ? " · " +
                    new Date(doc.reviewedAt).toLocaleDateString("id-ID", {
                      timeZone: "Asia/Jakarta",
                    })
                  : ""}
              </p>
            )}
            <form
              action={(form) => run(() => reviewDocument(form))}
              className="mt-4 flex flex-wrap items-center gap-3"
            >
              <input type="hidden" name="documentId" value={doc.id} />
              <input type="hidden" name="version" value={doc.version} />
              {doc.status === "draft" && (
                <button
                  disabled={busy}
                  name="status"
                  value="review"
                  className={button}
                >
                  Ajukan tinjauan
                </button>
              )}
              {doc.status === "review" && (
                <>
                  <label className="text-sm text-stone-600">
                    <input
                      type="checkbox"
                      name="reviewConfirmed"
                      required
                      className="mr-2"
                    />
                    Saya sudah memeriksa isi dan sumbernya.
                  </label>
                  <button
                    disabled={busy}
                    name="status"
                    value="published"
                    className="rounded-md bg-emerald-800 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Terbitkan versi ini
                  </button>
                </>
              )}
              {doc.status === "published" && (
                <button
                  disabled={busy}
                  name="status"
                  value="draft"
                  className={button}
                >
                  Tarik ke draft
                </button>
              )}
            </form>
          </article>
        ))}
      </div>
      {(filter.page > 1 || hasNext) && (
        <nav
          aria-label="Halaman dokumen"
          className="flex items-center justify-between gap-4 text-sm"
        >
          {filter.page > 1 ? (
            <Link
              className={button}
              href={listHref(filter, { page: filter.page - 1 })}
            >
              Sebelumnya
            </Link>
          ) : (
            <span />
          )}
          <span className="text-stone-600">Halaman {filter.page}</span>
          {hasNext ? (
            <Link
              className={button}
              href={listHref(filter, { page: filter.page + 1 })}
            >
              Berikutnya
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
