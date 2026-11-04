"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addTestCase,
  deleteTestCase,
  importTestCases,
  startEvaluation,
  fetchEvaluationRun,
  removeEvaluationRun,
} from "@/app/actions/evaluation";
import type {
  EvaluationRun,
  EvaluationTestCase,
  EvaluationQueryResult,
} from "@/lib/db/schema";
const field =
  "mt-1 block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900";
function pct(value: string | number | null | undefined) {
  const n = value == null ? NaN : Number(value);
  return Number.isFinite(n) ? (n * 100).toFixed(1) + "%" : "Belum terukur";
}
function TestForm({
  test,
  saved,
}: {
  test?: EvaluationTestCase;
  saved: () => void;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(form: FormData) {
    setBusy(true);
    try {
      const result = await addTestCase(form);
      setMessage(result.error || "Kasus uji tersimpan dan ditinjau.");
      if (!result.error) saved();
    } catch {
      setMessage("Kasus uji belum tersimpan. Periksa koneksi dan hak akses.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form action={submit} className="space-y-3">
      {test && <input type="hidden" name="id" value={test.id} />}
      <label className="block text-sm">
        Pertanyaan
        <textarea
          name="query"
          required
          maxLength={8000}
          rows={2}
          defaultValue={test?.query}
          className={field}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Kategori
          <input
            name="category"
            maxLength={100}
            defaultValue={test?.category || ""}
            className={field}
          />
        </label>
        <label className="text-sm">
          Perilaku yang diharapkan
          <select
            name="expectedBehavior"
            defaultValue={test?.expectedBehavior || "answer"}
            className={field}
          >
            <option value="answer">Menjawab berdasarkan sumber</option>
            <option value="abstain">Menyatakan sumber tidak memadai</option>
            <option value="out_of_scope">Menolak topik di luar cakupan</option>
          </select>
        </label>
      </div>
      <label className="block text-sm">
        Jawaban acuan
        <textarea
          name="referenceAnswer"
          maxLength={12000}
          rows={4}
          defaultValue={test?.referenceAnswer || ""}
          className={field}
        />
        <span className="text-xs text-stone-500">
          Wajib untuk kasus yang mengharapkan jawaban. Isi jawaban yang sudah
          diperiksa peninjau materi.
        </span>
      </label>
      <label className="block text-sm">
        ID dokumen acuan
        <input
          name="expectedDocumentIds"
          defaultValue={test?.expectedDocumentIds?.join(", ") || ""}
          className={field}
        />
        <span className="text-xs text-stone-500">
          Pisahkan UUID dengan koma. Tanpa acuan dokumen, precision/recall/F1
          ditandai belum terukur.
        </span>
      </label>
      <label className="block text-sm">
        <input type="checkbox" name="reviewed" required className="mr-2" />
        Saya telah meninjau pertanyaan, jawaban acuan, dan perilaku yang
        diharapkan.
      </label>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <button
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2 text-sm text-on-primary font-bold disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : "Simpan dan tandai ditinjau"}
      </button>
    </form>
  );
}
export default function EvaluationClient({
  cases,
  runs,
}: {
  cases: EvaluationTestCase[];
  runs: EvaluationRun[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"runs" | "cases">("runs");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<{
    run: EvaluationRun;
    queryResults: EvaluationQueryResult[];
  } | null>(null);
  async function execute(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Permintaan gagal.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl leading-none">
          Evaluasi jawaban dan retrieval
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-stone-600">
          Pengujian memakai alur jawaban yang sama dengan chat. Skor dari
          penilai AI membantu pemeriksaan dan tetap memerlukan tinjauan ahli.
          Kegagalan penilai dan ketiadaan acuan ditampilkan secara eksplisit.
        </p>
      </div>
      <nav
        className="flex gap-5 border-b border-stone-200 pb-3"
        aria-label="Bagian evaluasi"
      >
        <button
          onClick={() => setTab("runs")}
          aria-pressed={tab === "runs"}
          className={tab === "runs" ? "font-semibold" : "text-stone-500"}
        >
          Hasil evaluasi
        </button>
        <button
          onClick={() => setTab("cases")}
          aria-pressed={tab === "cases"}
          className={tab === "cases" ? "font-semibold" : "text-stone-500"}
        >
          Kasus uji ({cases.length})
        </button>
      </nav>
      {message && (
        <p
          role="status"
          className="border border-stone-200 bg-white p-3 text-sm"
        >
          {message}
        </p>
      )}
      {tab === "cases" ? (
        <div className="space-y-6">
          <details className="border border-stone-200 bg-white p-5">
            <summary className="cursor-pointer font-medium">
              Tambah kasus uji
            </summary>
            <div className="mt-4">
              <TestForm saved={() => router.refresh()} />
            </div>
          </details>
          <label className="block text-sm">
            Impor JSON (maksimal 50 kasus, wajib ditinjau setelah impor)
            <input
              type="file"
              accept=".json,application/json"
              disabled={busy}
              className="mt-2 block max-w-full text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.size > 1_000_000) {
                  setMessage("Ukuran JSON maksimal 1 MB.");
                  return;
                }
                await execute(async () => {
                  const input: unknown = JSON.parse(await file.text());
                  const result = await importTestCases(input);
                  if (result.error) throw new Error(result.error);
                  setMessage("Kasus diimpor sebagai belum ditinjau.");
                });
              }}
            />
          </label>
          {!cases.length && (
            <p className="text-sm text-stone-600">Belum ada kasus uji.</p>
          )}
          {cases.map((test) => (
            <details key={test.id} className="border-b border-stone-200 pb-4">
              <summary className="cursor-pointer text-sm font-medium">
                {test.query}
                <span className="ml-3 text-xs font-normal text-stone-500">
                  {test.reviewedAt
                    ? "Ditinjau " + test.reviewedBy
                    : "Belum ditinjau"}
                </span>
              </summary>
              <div className="mt-4">
                <TestForm test={test} saved={() => router.refresh()} />
                <button
                  disabled={busy}
                  className="mt-4 text-sm text-red-700"
                  onClick={() => {
                    if (confirm("Hapus kasus uji ini?"))
                      void execute(async () => {
                        await deleteTestCase(test.id);
                      });
                  }}
                >
                  Hapus kasus uji
                </button>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <form
            action={(form) =>
              execute(async () => {
                const result = await startEvaluation(form);
                if (!("runId" in result)) throw new Error(result.error);
                setSelected(await fetchEvaluationRun(result.runId));
                setMessage("Evaluasi selesai.");
              })
            }
            className="flex flex-wrap items-end gap-3"
          >
            <label className="flex-1 text-sm">
              Nama evaluasi
              <input
                name="name"
                maxLength={200}
                className={field}
                placeholder="Contoh: Fikih ibadah, revisi sumber 2"
              />
            </label>
            <button
              disabled={busy || !cases.length}
              className="rounded-md bg-primary px-4 py-2 text-sm text-on-primary font-bold disabled:opacity-50"
            >
              {busy ? "Memproses..." : "Jalankan evaluasi"}
            </button>
          </form>
          {busy && (
            <p role="status" className="text-sm text-stone-600">
              Evaluasi dapat memerlukan beberapa menit. Tunggu proses selesai.
            </p>
          )}
          {!runs.length && (
            <p className="text-sm text-stone-600">Belum ada hasil evaluasi.</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-300">
                  <th className="py-3 pr-4">Evaluasi</th>
                  <th className="pr-4">Precision</th>
                  <th className="pr-4">Recall</th>
                  <th className="pr-4">Ketepatan jawaban</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-stone-200">
                    <td className="py-3 pr-4">
                      <button
                        disabled={busy}
                        className="text-left font-medium underline underline-offset-4"
                        onClick={() =>
                          execute(async () => {
                            setSelected(await fetchEvaluationRun(run.id));
                          })
                        }
                      >
                        {run.name}
                      </button>
                      <p className="mt-1 text-xs text-stone-500">
                        {run.totalQueries} kasus ·{" "}
                        {new Date(run.createdAt).toLocaleDateString("id-ID", {
                          timeZone: "Asia/Jakarta",
                        })}
                        {!run.answerMetrics && " · Evaluasi lama"}
                      </p>
                    </td>
                    <td className="pr-4">{pct(run.avgPrecision)}</td>
                    <td className="pr-4">{pct(run.avgRecall)}</td>
                    <td className="pr-4">
                      {run.answerMetrics
                        ? pct(run.avgAccuracy)
                        : "Kecukupan konteks (lama)"}
                    </td>
                    <td>
                      <button
                        disabled={busy}
                        className="text-red-700"
                        onClick={() => {
                          if (confirm("Hapus hasil ini?"))
                            void execute(async () => {
                              await removeEvaluationRun(run.id);
                              if (selected?.run.id === run.id)
                                setSelected(null);
                            });
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected && (
            <section className="space-y-4 border-t border-stone-300 pt-6">
              <h2 className="font-heading">{selected.run.name}</h2>
              {selected.run.answerMetrics ? (
                <>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    {[
                      [
                        "Dukungan sumber",
                        selected.run.answerMetrics.groundedness,
                      ],
                      [
                        "Ketepatan jawaban",
                        selected.run.answerMetrics.correctness,
                      ],
                      ["Kelengkapan", selected.run.answerMetrics.completeness],
                      [
                        "Ketepatan kutipan",
                        selected.run.answerMetrics.citationAccuracy,
                      ],
                      [
                        "Perilaku sesuai",
                        selected.run.answerMetrics.behaviorPassRate,
                      ],
                      ["F1 dokumen", selected.run.avgF1Score],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <dt className="text-xs text-stone-500">{label}</dt>
                        <dd className="mt-1 text-lg font-semibold">
                          {pct(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-xs text-stone-600">
                    Penilai gagal pada{" "}
                    {selected.run.answerMetrics.judgeFailures} kasus. Retrieval
                    terukur pada{" "}
                    {selected.run.answerMetrics.retrievalMeasuredCases} kasus;
                    ketepatan jawaban terukur pada{" "}
                    {selected.run.answerMetrics.correctnessMeasuredCases} kasus.
                    Rata-rata hanya memakai skor yang tersedia.
                  </p>
                </>
              ) : (
                <p className="text-sm text-amber-800">
                  Hasil lama mengukur kecukupan konteks dan mungkin memakai
                  metrik perkiraan. Jalankan ulang dengan kasus uji yang
                  ditinjau untuk mengukur jawaban akhir.
                </p>
              )}
              {selected.queryResults.map((result) => (
                <details
                  key={result.id}
                  className="border-b border-stone-200 py-3"
                >
                  <summary className="cursor-pointer text-sm font-medium">
                    {result.query}
                  </summary>
                  <p className="mt-3 text-xs text-stone-600">
                    P: {pct(result.precision)} · R: {pct(result.recall)} · F1:{" "}
                    {pct(result.f1Score)}
                  </p>
                  {result.answerEvaluation && (
                    <>
                      <p className="mt-3 text-sm">
                        Perilaku:{" "}
                        {result.answerEvaluation.behaviorPassed
                          ? "Sesuai"
                          : "Tidak sesuai"}{" "}
                        · Dukungan sumber:{" "}
                        {pct(result.answerEvaluation.groundedness)} · Ketepatan
                        kutipan: {pct(result.answerEvaluation.citationAccuracy)}
                      </p>
                      <h3 className="mt-4 text-sm font-medium">
                        Jawaban aktual
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                        {result.answerEvaluation.response}
                      </p>
                      <h3 className="mt-4 text-sm font-medium">
                        Jawaban acuan
                      </h3>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {result.answerEvaluation.referenceAnswer ||
                          "Tidak tersedia"}
                      </p>
                    </>
                  )}
                  <p className="mt-4 text-sm text-stone-600">
                    {result.answerEvaluation?.explanation ||
                      result.llmAccuracyRating}
                  </p>
                </details>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
