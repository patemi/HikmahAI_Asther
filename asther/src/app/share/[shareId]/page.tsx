import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { notFound } from "next/navigation";
import SharedConversation from "@/app/chat/SharedConversation";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Percakapan dibagikan — Hikmah AI",
  robots: { index: false, follow: false },
};
export default async function SharedPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  if (!z.uuid().safeParse(shareId).success) notFound();
  const share = await db.query.conversationShares.findFirst({
    where: eq(schema.conversationShares.id, shareId),
  });
  if (!share) notFound();
  return <SharedConversation snapshot={share.snapshot} />;
}
