import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import KnowledgeClient from "./KnowledgeClient";

export default async function KnowledgePage() {
  const documents = await db.query.knowledgeDocuments.findMany({
    orderBy: [desc(schema.knowledgeDocuments.createdAt)],
  });

  return <KnowledgeClient documents={documents} />;
}
