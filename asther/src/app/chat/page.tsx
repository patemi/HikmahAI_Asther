import { db, schema } from "@/lib/db";
import ChatClient from "./ChatClient";

export const metadata = {
  title: "Chat — HikmahAI",
  description: "Tanyakan seputar Islam kepada HikmahAI, asisten AI keislaman Anda",
};

export default async function ChatPage() {
  const config = await db.query.appConfig.findFirst();
  const botName = config?.botName || "Asther";

  return <ChatClient botName={botName} />;
}
