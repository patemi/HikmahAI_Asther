import { createHash } from "node:crypto";
import { requireAdminPage } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { sql, gte } from "drizzle-orm";
import { limitSetting } from "@/lib/limits";

export default async function UsagePage() {
  await requireAdminPage();
  const since = new Date(Date.now() - 30 * 86400000);
  const usage = await db
    .select({
      model: schema.modelUsage.model,
      purpose: schema.modelUsage.purpose,
      calls: sql<number>`count(*)::int`,
      input: sql<number>`coalesce(sum(${schema.modelUsage.promptTokens}),0)::bigint`,
      output: sql<number>`coalesce(sum(${schema.modelUsage.completionTokens}),0)::bigint`,
    })
    .from(schema.modelUsage)
    .where(gte(schema.modelUsage.createdAt, since))
    .groupBy(schema.modelUsage.model, schema.modelUsage.purpose);
  const keys = ["model-day", "token-day"].map((scope) =>
    createHash("sha256")
      .update(scope + ":all")
      .digest("hex"),
  );
  const buckets = await db.query.rateLimitBuckets.findMany({
    where: (t, { inArray, and, gt }) =>
      and(inArray(t.key, keys), gt(t.resetAt, new Date())),
  });
  const requests = buckets.find((b) => b.key === keys[0]);
  const tokens = buckets.find((b) => b.key === keys[1]);
  const format = (n: number) => Number(n).toLocaleString("id-ID");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl leading-none">Pemakaian layanan AI</h1>
        <p className="mt-1 text-sm text-stone-600">
          Kuota berlaku di seluruh instance aplikasi melalui database yang sama.
        </p>
      </div>
      <dl className="grid gap-5 border-y border-stone-200 py-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-stone-600">
            Percobaan request model · periode 24 jam
          </dt>
          <dd className="mt-1 text-xl font-semibold">
            {format(requests?.hits || 0)} /{" "}
            {format(limitSetting("MODEL_REQUESTS_PER_DAY", 2000))}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-stone-600">
            Cadangan anggaran token · periode 24 jam
          </dt>
          <dd className="mt-1 text-xl font-semibold">
            {format(tokens?.hits || 0)} /{" "}
            {format(limitSetting("MODEL_TOKENS_PER_DAY", 500000, 100000000))}
          </dd>
        </div>
      </dl>
      <p className="max-w-3xl text-sm leading-relaxed text-stone-600">
        Anggaran dicadangkan sebelum request, termasuk percobaan yang gagal.
        Angka ini berbeda dari token aktual yang dilaporkan provider. Kuota
        membantu membatasi pemakaian; jumlah tagihan mengikuti model, pemrosesan
        gambar, dan harga provider.
      </p>
      <h2 className="font-heading">
        Token yang dilaporkan provider · 30 hari terakhir
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-300">
              <th className="py-3 pr-4">Model</th>
              <th className="pr-4">Kegunaan</th>
              <th className="pr-4">Selesai / tercatat</th>
              <th className="pr-4">Token masukan</th>
              <th>Token keluaran</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((row) => (
              <tr
                key={row.model + row.purpose}
                className="border-b border-stone-200"
              >
                <td className="py-3 pr-4 font-mono text-xs">{row.model}</td>
                <td className="pr-4">{row.purpose}</td>
                <td className="pr-4">{format(row.calls)}</td>
                <td className="pr-4">{format(row.input)}</td>
                <td>{format(row.output)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!usage.length && (
        <p className="text-sm text-stone-600">
          Belum ada pemakaian tercatat. Provider yang tidak mengirim informasi
          token dapat menghasilkan catatan nol token.
        </p>
      )}
      <p className="text-sm text-stone-600">
        Batas chat per akun: {limitSetting("CHAT_REQUESTS_PER_MINUTE", 10)} per
        menit dan {limitSetting("CHAT_REQUESTS_PER_DAY", 100)} per periode 24
        jam. Perubahan kuota dilakukan melalui konfigurasi deployment.
      </p>
    </div>
  );
}
