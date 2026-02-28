import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ChatClient from "@/app/chat/ChatClient";
import ChatAuthClient from "@/app/chat/ChatAuthClient";

export const metadata = {
  title: "Chat — HikmahAI",
  description: "Tanyakan seputar Islam kepada HikmahAI, asisten AI keislaman Anda",
};

export default async function ChatPage() {
  const config = await db.query.appConfig.findFirst();
  const botName = config?.botName || "Asther";
  const user = await getSession();

  if (!user) {
    return <ChatAuthClient botName={botName} />;
  }

  return (
    <ChatClient
      botName={botName}
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
      }}
    />
  );
}
