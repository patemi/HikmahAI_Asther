import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import EvaluationClient from "./EvaluationClient";

export default async function EvaluationPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <EvaluationClient />;
}
