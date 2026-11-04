import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import ReviewForm from "./ReviewForm";

const labels = {
  incorrect: "Isi atau dalil keliru",
  citation: "Sumber tidak sesuai",
  unclear: "Penjelasan membingungkan",
  other: "Lainnya",
};
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const status = ["open", "reviewing", "resolved"].includes(params.status || "")
    ? (params.status as "open" | "reviewing" | "resolved")
    : "open";
  const page = Math.max(1, Math.min(Number(params.page) || 1, 10000));
  const reports = await db.query.answerFeedback.findMany({
    where: eq(schema.answerFeedback.status, status),
    orderBy: [desc(schema.answerFeedback.createdAt)],
    limit: 21,
    offset: (page - 1) * 20,
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl leading-none">Laporan jawaban</h1>
        <p className="mt-1 text-sm text-stone-600">
          Periksa laporan terhadap jawaban dan rujukan yang diterima pengguna
          saat itu.
        </p>
      </div>
      <nav aria-label="Status laporan" className="flex flex-wrap gap-4 text-sm">
        {(["open", "reviewing", "resolved"] as const).map((value) => (
          <Link
            key={value}
            href={"/dashboard/reports?status=" + value}
            aria-current={status === value ? "page" : undefined}
            className={
              status === value
                ? "font-semibold underline underline-offset-4"
                : "text-stone-600"
            }
          >
            {value === "open"
              ? "Baru"
              : value === "reviewing"
                ? "Dalam tinjauan"
                : "Selesai"}
          </Link>
        ))}
      </nav>
      {!reports.length && (
        <p className="border-y border-stone-200 py-10 text-sm text-stone-600">
          Belum ada laporan pada status ini.
        </p>
      )}
      {reports.slice(0, 20).map((report) => (
        <article
          key={report.id}
          className="border border-stone-200 bg-white p-5"
        >
          <p className="text-xs text-stone-500">
            {new Date(report.createdAt).toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
            })}{" "}
            WIB
          </p>
          <h2 className="mt-1 font-heading">{labels[report.reason]}</h2>
          <p className="mt-2 text-sm whitespace-pre-wrap">
            {report.details || "Tanpa keterangan tambahan."}
          </p>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer font-medium">
              Periksa percakapan dan rujukan
            </summary>
            <p className="mt-3 font-medium">Pertanyaan</p>
            <p className="whitespace-pre-wrap">{report.snapshot.question}</p>
            <p className="mt-3 font-medium">Jawaban yang dilaporkan</p>
            <p className="whitespace-pre-wrap">{report.snapshot.answer}</p>
            {report.snapshot.citations.map((citation, i) => (
              <blockquote
                key={citation.chunkId}
                className="mt-3 border-l-2 border-stone-300 pl-3"
              >
                <p>
                  [{i + 1}] {citation.title} · Versi {citation.version}
                </p>
                <p className="text-stone-600 whitespace-pre-wrap">
                  {citation.excerpt}
                </p>
              </blockquote>
            ))}
            <p className="mt-3 text-xs text-stone-500">
              Prompt:{" "}
              {report.snapshot.provenance?.promptVersion || "Tidak tercatat"} ·
              Model:{" "}
              {report.snapshot.provenance?.model || "Tanpa generasi model"}
            </p>
          </details>
          <ReviewForm
            id={report.id}
            status={report.status}
            resolution={report.resolution}
          />
        </article>
      ))}
      <div className="flex gap-5 text-sm">
        {page > 1 && (
          <Link
            href={"/dashboard/reports?status=" + status + "&page=" + (page - 1)}
          >
            Sebelumnya
          </Link>
        )}
        {reports.length > 20 && (
          <Link
            href={"/dashboard/reports?status=" + status + "&page=" + (page + 1)}
          >
            Berikutnya
          </Link>
        )}
      </div>
    </div>
  );
}
