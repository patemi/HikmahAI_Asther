import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.id),
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <SettingsClient
      user={{
        id: user.id,
        email: user.email || "",
        name: user.name || "",
      }}
    />
  );
}
