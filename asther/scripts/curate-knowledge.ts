/**
 * One-off cleanup for the bulk Qur'an / hadith import.
 *
 *   bun scripts/curate-knowledge.ts            backup, dedupe, label, convert Qur'an JSON
 *   bun scripts/curate-knowledge.ts --publish  also publish every curated collection
 *
 * Safe to re-run: each step only touches rows still in their raw imported shape.
 * The backup lives in the `backup` schema, which drizzle-kit does not manage.
 */
import { db, schema } from "@/lib/db";
import { chunkText } from "@/lib/rag";
import { and, eq, inArray, sql } from "drizzle-orm";

// Identity inferred from the data itself (field names and the 2019 translation
// wording with footnotes). Change these if the dataset came from elsewhere.
const QURAN_SOURCE =
  "Al-Qur'an dan Terjemahannya, Kementerian Agama RI (quran.kemenag.go.id)";
const QURAN_AUTHOR = "Kementerian Agama RI";

const HADITH = {
  shahih_bukhari: ["Shahih al-Bukhari", "Imam al-Bukhari"],
  shahih_muslim: ["Shahih Muslim", "Imam Muslim"],
  sunan_abu_daud: ["Sunan Abu Dawud", "Imam Abu Dawud"],
  sunan_tirmidzi: ["Sunan at-Tirmidzi", "Imam at-Tirmidzi"],
  sunan_nasai: ["Sunan an-Nasa'i", "Imam an-Nasa'i"],
  sunan_ibnu_majah: ["Sunan Ibnu Majah", "Imam Ibnu Majah"],
  muwatho_malik: ["Al-Muwaththa'", "Imam Malik"],
  riyadhus_shalihin: ["Riyadhus Shalihin", "Imam an-Nawawi"],
} as const;

// The import split each hadith into overlapping 800-character entries. Once
// rejoined, the hadith counts equal the Lidwa Pusaka "Ensiklopedi Hadits Kitab
// 9 Imam" numbering exactly (Bukhari 7008, Muslim 5362, ...), so the running
// number is that edition's hadith number. Riyadhus Shalihin is one continuous
// text cut into windows and cannot be rejoined per hadith.
const LIDWA_SHORT: Partial<Record<keyof typeof HADITH, string>> = {
  shahih_bukhari: "Bukhari",
  shahih_muslim: "Muslim",
  sunan_abu_daud: "Abu Dawud",
  sunan_tirmidzi: "Tirmidzi",
  sunan_nasai: "Nasa'i",
  sunan_ibnu_majah: "Ibnu Majah",
  muwatho_malik: "Malik",
};
const WHOLE_CHUNK_MAX = 6000;

const docs = schema.knowledgeDocuments;
const rows = (result: unknown) =>
  [...((result as { rows?: unknown[] }).rows ?? (result as unknown[]))] as Array<
    Record<string, unknown>
  >;

async function backup() {
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS backup`);
  const [exists] = rows(
    await db.execute(
      sql`SELECT to_regclass('backup.knowledge_documents_20261101') IS NOT NULL AS ok`,
    ),
  );
  if (exists.ok) return console.log("backup: already present, kept as is");
  await db.execute(
    sql`CREATE TABLE backup.knowledge_documents_20261101 AS TABLE knowledge_documents`,
  );
  console.log("backup: backup.knowledge_documents_20261101 created");
}

// Removes copies whose title AND content are identical, keeping the oldest.
async function dedupe() {
  const deleted = rows(
    await db.execute(sql`
      DELETE FROM knowledge_documents d
      USING (
        SELECT id, row_number() OVER (
          PARTITION BY title, md5(content) ORDER BY created_at, id
        ) AS rn
        FROM knowledge_documents
      ) x
      WHERE d.id = x.id AND x.rn > 1
      RETURNING d.id`),
  );
  console.log("dedupe: removed", deleted.length, "identical copies");
}

// Hadith text is already readable; only the identity fields are missing.
async function labelHadith() {
  for (const [key, [book, author]] of Object.entries(HADITH)) {
    const updated = rows(
      await db.execute(sql`
        UPDATE knowledge_documents SET
          title = ${"Hadis " + book + " #"} || split_part(title, ' #', 2),
          source = ${book + " (terjemahan Indonesia)"},
          author = ${author},
          locator = 'Entri dataset no. ' || split_part(title, ' #', 2),
          metadata = jsonb_build_object(
            'collection', ${key}::text,
            'entry', split_part(title, ' #', 2)::int,
            'numbering', 'dataset'
          ),
          updated_at = now()
        WHERE title ~ ${"^" + key + " #[0-9]+$"}
        RETURNING id`),
    );
    console.log("hadith:", key, updated.length);
  }
}

type Ayah = {
  surah_id: number;
  ayah: number;
  juz: number | null;
  page: number | null;
  arabic: string;
  latin: string | null;
  translation: string;
  footnotes: string | null;
  surah: { transliteration: string; translation: string; location: string };
};
type Surah = {
  id: number;
  arabic: string;
  transliteration: string;
  translation: string;
  num_ayah: number;
  page: number;
  location: string;
};

// Kemenag marks footnotes inline ("ke sana.710) Dia"); the numbers only make
// sense next to the printed footnote, so they are dropped from the reading text.
const stripFootnoteMarks = (text: string) =>
  text.replace(/(?<=[^\s(\d])\d{1,4}\)/g, "").replace(/\s{2,}/g, " ").trim();
const cleanFootnotes = (text: string) =>
  text.replace(/(^|\s)\d{1,4}\)\s*/g, "$1").replace(/\s{2,}/g, " ").trim();

// Arabic and meaning only: the transliteration confused readers more than it helped.
function ayahDocument(a: Ayah) {
  const name = a.surah.transliteration.trim();
  return {
    title: `QS ${name} [${a.surah_id}]: ${a.ayah}`,
    locator:
      `Surah ${name} (${a.surah_id}) ayat ${a.ayah}` +
      (a.juz ? `, juz ${a.juz}` : "") +
      (a.page ? `, hlm. ${a.page}` : ""),
    content: [
      `QS ${name} [${a.surah_id}]: ${a.ayah}`,
      a.arabic.trim(),
      `Artinya: ${stripFootnoteMarks(a.translation)}`,
      a.footnotes?.trim() && `Catatan: ${cleanFootnotes(a.footnotes)}`,
    ]
      .filter(Boolean)
      .join("\n"),
    metadata: {
      collection: "quran",
      surah: a.surah_id,
      ayah: a.ayah,
      juz: a.juz,
      page: a.page,
      format: 2,
    },
  };
}

function surahDocument(s: Surah) {
  const name = s.transliteration.trim();
  return {
    title: `Surah ${name} [${s.id}]`,
    locator: `Surah ${name} (${s.id})`,
    content:
      `Surah ${name} (${s.arabic.trim()}) adalah surah ke-${s.id} dalam Al-Qur'an. ` +
      `Nama surah ini berarti "${s.translation.trim()}". ` +
      `Surah ini terdiri atas ${s.num_ayah} ayat, tergolong surah ${s.location.trim()}, ` +
      `dan dimulai pada halaman ${s.page} mushaf.`,
    metadata: { collection: "quran-surah", surah: s.id },
  };
}

// Raw JSON rows become readable text, so their chunks are rebuilt (without
// embeddings; the dashboard's embedding panel fills those in later).
async function convertQuran() {
  const raw = await db
    .select({ id: docs.id, content: docs.content, version: docs.version })
    .from(docs)
    .where(
      sql`${docs.content} LIKE '{%' AND ${docs.title} ~ '^([0-9]+|surah-list) #[0-9]+$'`,
    );
  let converted = 0;
  let skipped = 0;
  for (let i = 0; i < raw.length; i += 250) {
    const batch = raw.slice(i, i + 250);
    await db.transaction(async (tx) => {
      const ids: string[] = [];
      const chunks: Array<typeof schema.knowledgeChunks.$inferInsert> = [];
      for (const row of batch) {
        let parsed: Ayah | Surah;
        try {
          parsed = JSON.parse(row.content);
        } catch {
          skipped++;
          continue;
        }
        const next =
          "ayah" in parsed && parsed.ayah
            ? ayahDocument(parsed as Ayah)
            : surahDocument(parsed as Surah);
        await tx
          .update(docs)
          .set({
            ...next,
            source: QURAN_SOURCE,
            author: QURAN_AUTHOR,
            version: row.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(docs.id, row.id));
        ids.push(row.id);
        for (const [chunkIndex, content] of chunkText(next.content).entries())
          chunks.push({ documentId: row.id, content, chunkIndex });
        converted++;
      }
      if (!ids.length) return;
      await tx
        .delete(schema.knowledgeChunks)
        .where(inArray(schema.knowledgeChunks.documentId, ids));
      await tx.insert(schema.knowledgeChunks).values(chunks);
    });
    process.stdout.write(`\rquran: ${converted} converted`);
  }
  console.log(`\rquran: ${converted} converted, ${skipped} unreadable`);
}

// Rewrites ayah documents converted before format 2, from the original JSON in the backup.
async function reshapeQuran() {
  const stale = rows(
    await db.execute(sql`
      SELECT d.id, d.version, b.content AS raw
      FROM knowledge_documents d
      JOIN LATERAL (
        SELECT content FROM backup.knowledge_documents_20261101 b
        WHERE b.title = (d.metadata->>'surah') || ' #' || (d.metadata->>'ayah')
        LIMIT 1
      ) b ON true
      WHERE d.metadata->>'collection' = 'quran'
        AND coalesce(d.metadata->>'format', '1') <> '2'`),
  );
  for (let i = 0; i < stale.length; i += 500) {
    await db.transaction(async (tx) => {
      for (const row of stale.slice(i, i + 500)) {
        const next = ayahDocument(JSON.parse(String(row.raw)) as Ayah);
        await tx
          .update(docs)
          .set({
            ...next,
            version: Number(row.version) + 1,
            updatedAt: new Date(),
          })
          .where(eq(docs.id, String(row.id)));
      }
    });
  }
  console.log("quran: reshaped", stale.length, "ayat (tanpa latin)");
}

/** Length of the overlap when `next` continues `prev`, else -1. Works on raw text. */
function continuation(prev: string, next: string) {
  const head = next.slice(0, 40);
  if (head.length < 40) return -1;
  for (
    let idx = prev.indexOf(head, Math.max(0, prev.length - 500));
    idx !== -1;
    idx = prev.indexOf(head, idx + 1)
  ) {
    const tail = prev.slice(idx);
    if (next.startsWith(tail)) return tail.length;
  }
  return -1;
}
const unescapeQuotes = (text: string) => text.replace(/\\"/g, '"').trim();

async function mergeHadith() {
  for (const [key, [book, author]] of Object.entries(HADITH)) {
    const entries = rows(
      await db.execute(sql`
        SELECT id, content, version, (metadata->>'entry')::int AS entry
        FROM knowledge_documents
        WHERE metadata->>'collection' = ${key} AND metadata->>'numbering' = 'dataset'
        ORDER BY 4`),
    );
    if (!entries.length) continue;
    const short = LIDWA_SHORT[key as keyof typeof HADITH];
    type Group = { id: string; version: number; text: string; drop: string[] };
    const groups: Group[] = [];
    for (const entry of entries) {
      const text = String(entry.content);
      const last = groups.at(-1);
      const k = short && last ? continuation(last.text, text) : -1;
      if (last && k > 0) {
        last.text += text.slice(k);
        last.drop.push(String(entry.id));
      } else
        groups.push({
          id: String(entry.id),
          version: Number(entry.version),
          text,
          drop: [],
        });
    }
    for (let i = 0; i < groups.length; i += 500) {
      await db.transaction(async (tx) => {
        for (const [offset, group] of groups.slice(i, i + 500).entries()) {
          const number = i + offset + 1;
          await tx
            .update(docs)
            .set(
              short
                ? {
                    title: `HR. ${short} no. ${number}`,
                    source: `${book}, terjemahan Lidwa Pusaka (Ensiklopedi Hadits Kitab 9 Imam)`,
                    author,
                    locator: `Hadis no. ${number} (penomoran Lidwa Pusaka)`,
                    content: unescapeQuotes(group.text),
                    metadata: { collection: key, number, numbering: "lidwa" },
                    version: group.version + 1,
                    updatedAt: new Date(),
                  }
                : {
                    title: `${book}, penggalan ${number}`,
                    locator: `Penggalan teks no. ${number} (bukan nomor hadis)`,
                    content: unescapeQuotes(group.text),
                    metadata: { collection: key, segment: number, numbering: "segment" },
                    version: group.version + 1,
                    updatedAt: new Date(),
                  },
            )
            .where(eq(docs.id, group.id));
          if (group.drop.length)
            await tx.delete(docs).where(inArray(docs.id, group.drop));
        }
      });
    }
    console.log(
      "hadith:",
      key,
      entries.length,
      "entri →",
      groups.length,
      short ? "hadis" : "penggalan",
    );
  }
}

const ENTITIES: Record<string, string> = {
  nbsp: " ",
  quot: '"',
  amp: "&",
  lt: "<",
  gt: ">",
  apos: "'",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  ndash: "–",
  mdash: "—",
};
// Riyadhus Shalihin came from HTML pages. Windows cut tags in half, so a
// fragment may start with the end of an attribute list or stop inside a tag.
function htmlToText(html: string) {
  return html
    .replace(/^[^<>]*?"\s*>/, "")
    .replace(/<[^>]*$/, "")
    .replace(/<\s*(br|\/p|\/h[1-6]|\/div|\/li)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function cleanHtml() {
  const dirty = await db
    .select({ id: docs.id, content: docs.content, version: docs.version, metadata: docs.metadata })
    .from(docs)
    .where(
      sql`${docs.metadata}->>'collection' = 'riyadhus_shalihin' AND (${docs.content} ~ '<[a-zA-Z/][^>]*>|&[a-z]+;|&#[0-9]+;' OR ${docs.content} ~ '^[^<>]*?"\\s*>')`,
    );
  for (let i = 0; i < dirty.length; i += 500) {
    await db.transaction(async (tx) => {
      for (const doc of dirty.slice(i, i + 500)) {
        const metadata = { ...(doc.metadata as Record<string, unknown>) };
        delete metadata.chunking;
        await tx
          .update(docs)
          .set({
            content: htmlToText(doc.content) || doc.content,
            metadata,
            version: doc.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(docs.id, doc.id));
      }
    });
  }
  console.log("html: cleaned", dirty.length, "penggalan Riyadhus Shalihin");
}

// One chunk per ayah or hadith so citations show the whole text; only very
// long hadith are split. Embeddings are cleared and refilled from the dashboard.
async function rechunk() {
  const pending = await db
    .select({ id: docs.id, content: docs.content, metadata: docs.metadata })
    .from(docs)
    .where(
      sql`${docs.metadata}->>'collection' IS NOT NULL AND coalesce(${docs.metadata}->>'chunking', '') <> 'whole'`,
    );
  for (let i = 0; i < pending.length; i += 500) {
    const batch = pending.slice(i, i + 500);
    await db.transaction(async (tx) => {
      const ids = batch.map((doc) => doc.id);
      await tx
        .delete(schema.knowledgeChunks)
        .where(inArray(schema.knowledgeChunks.documentId, ids));
      await tx.insert(schema.knowledgeChunks).values(
        batch.flatMap((doc) =>
          (doc.content.length <= WHOLE_CHUNK_MAX
            ? [doc.content]
            : chunkText(doc.content, 4000, 300)
          ).map((content, chunkIndex) => ({
            documentId: doc.id,
            content,
            chunkIndex,
          })),
        ),
      );
      for (const doc of batch)
        await tx
          .update(docs)
          .set({
            metadata: {
              ...(doc.metadata as Record<string, unknown>),
              chunking: "whole",
            },
          })
          .where(eq(docs.id, doc.id));
    });
    process.stdout.write(`\rrechunk: ${Math.min(i + 500, pending.length)}/${pending.length}`);
  }
  console.log(`\rrechunk: ${pending.length} dokumen`);
}

// Collection-level review: every document of a curated collection is published
// together, recorded as such in reviewedBy so it is distinguishable later.
async function publish() {
  const published = await db
    .update(docs)
    .set({
      status: "published",
      reviewedBy: "Tinjauan per koleksi (skrip kurasi)",
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        sql`${docs.metadata}->>'collection' IS NOT NULL`,
        sql`coalesce(${docs.source}, '') <> ''`,
        sql`${docs.status} <> 'published'`,
      ),
    )
    .returning({ id: docs.id });
  console.log("publish:", published.length, "documents");
}

await backup();
await dedupe();
await labelHadith();
await convertQuran();
await reshapeQuran();
await mergeHadith();
await cleanHtml();
await rechunk();
if (process.argv.includes("--publish")) await publish();
const summary = rows(
  await db.execute(sql`
    SELECT coalesce(metadata->>'collection', '(lainnya)') AS collection,
      status, count(*)::int AS n
    FROM knowledge_documents GROUP BY 1, 2 ORDER BY 1, 2`),
);
console.table(summary);
process.exit(0);
