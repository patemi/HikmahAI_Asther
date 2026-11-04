import { getAppConfig } from "@/lib/app-config";
import { getSession } from "@/lib/auth";
import ChatClient from "@/app/chat/ChatClient";
import ChatAuthClient from "@/app/chat/ChatAuthClient";

export const metadata = {
  title: "Chat — Hikmah AI",
  description:
    "Tanya apa aja soal Islam ke Hikmah AI. Jawabannya ada dalilnya.",
};

export default async function ChatPage() {
  const config = await getAppConfig();
  const botName = config?.botName || "Hikmah AI";
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
        role: user.role,
      }}
    />
  );
}
