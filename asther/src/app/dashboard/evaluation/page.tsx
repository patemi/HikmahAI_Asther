import { requireAdminPage } from "@/lib/auth";
import { getTestCases } from "@/app/actions/evaluation";
import { getEvaluationRuns } from "@/lib/evaluation";
import EvaluationClient from "./EvaluationClient";
export default async function EvaluationPage() {
  await requireAdminPage();
  const [cases, runs] = await Promise.all([getTestCases(), getEvaluationRuns()]);
  return <EvaluationClient cases={cases} runs={runs} />;
}
