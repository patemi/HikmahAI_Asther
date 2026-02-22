import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage() {
  // Get all participants with their message counts
  const participants = await db.query.chatParticipants.findMany({
    orderBy: [desc(schema.chatParticipants.updatedAt)],
  });

  return <HistoryClient participants={participants} />;
}
