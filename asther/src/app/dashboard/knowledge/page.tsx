import { requireAdminPage } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import KnowledgeClient, {
  type KnowledgeListItem,
  type KnowledgeStatus,
} from "./KnowledgeClient";

const PAGE_SIZE = 25;
const STATUSES = ["draft", "review", "published"] as const;
const docs = schema.knowledgeDocuments;

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const status = STATUSES.includes(params.status as KnowledgeStatus)
    ? (params.status as KnowledgeStatus)
    : null;
  const q = (params.q || "").trim().slice(0, 200);
  const page = Math.max(1, Math.min(Number(params.page) || 1, 100000));

  const filters: SQL[] = [];
  if (status) filters.push(eq(docs.status, status));
  if (q) {
    const pattern = "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
    filters.push(
      or(
        ilike(docs.title, pattern),
        ilike(docs.locator, pattern),
        ilike(docs.source, pattern),
      )!,
    );
  }

  // The full text stays on the server: the list only needs a short preview,
  // and Edit / "Periksa isi" fetch one document's content on demand.
  const [rows, counts] = await Promise.all([
    db
      .select({
        id: docs.id,
        title: docs.title,
        source: docs.source,
        author: docs.author,
        locator: docs.locator,
        status: docs.status,
        version: docs.version,
        reviewedBy: docs.reviewedBy,
        reviewedAt: docs.reviewedAt,
        preview: sql<string>`left(${docs.content}, 280)`,
        contentLength: sql<number>`length(${docs.content})::int`,
      })
      .from(docs)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(docs.createdAt), desc(docs.id))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ status: docs.status, n: sql<number>`count(*)::int` })
      .from(docs)
      .groupBy(docs.status),
  ]);

  const totals = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
    KnowledgeStatus,
    number
  >;
  for (const row of counts) totals[row.status] = row.n;

  return (
    <KnowledgeClient
      documents={rows.slice(0, PAGE_SIZE) satisfies KnowledgeListItem[]}
      totals={totals}
      filter={{ q, status, page }}
      hasNext={rows.length > PAGE_SIZE}
    />
  );
}
