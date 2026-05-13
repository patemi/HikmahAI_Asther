"use server";

import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  runEvaluation,
  getEvaluationRuns,
  getEvaluationRun,
  deleteEvaluationRun,
} from "@/lib/evaluation";
import { eq } from "drizzle-orm";

// ─── Auth guard ──────────────────────────────────────────────

async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

// ─── Test Case Management ────────────────────────────────────

export async function getTestCases() {
  await requireAuth();
  return db.query.evaluationTestCases.findMany({
    orderBy: (tc, { desc }) => [desc(tc.createdAt)],
  });
}

export async function addTestCase(formData: FormData) {
  await requireAuth();

  const query = (formData.get("query") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;
  const expectedDocIdsRaw = (formData.get("expectedDocumentIds") as string)?.trim();

  if (!query) {
    return { error: "Query is required." };
  }

  const expectedDocumentIds = expectedDocIdsRaw
    ? expectedDocIdsRaw.split(",").map((id) => id.trim()).filter(Boolean)
    : [];

  await db.insert(schema.evaluationTestCases).values({
    query,
    category,
    expectedDocumentIds,
  });

  revalidatePath("/dashboard/evaluation");
  return { success: true };
}

export async function deleteTestCase(id: string) {
  await requireAuth();

  await db
    .delete(schema.evaluationTestCases)
    .where(eq(schema.evaluationTestCases.id, id));

  revalidatePath("/dashboard/evaluation");
  return { success: true };
}

export async function importTestCases(
  cases: Array<{ query: string; category?: string; expectedDocumentIds?: string[] }>
) {
  await requireAuth();

  let imported = 0;
  for (const tc of cases) {
    if (!tc.query?.trim()) continue;

    await db.insert(schema.evaluationTestCases).values({
      query: tc.query.trim(),
      category: tc.category?.trim() || null,
      expectedDocumentIds: tc.expectedDocumentIds ?? [],
    });
    imported++;
  }

  revalidatePath("/dashboard/evaluation");
  return { success: true, imported };
}

// ─── Evaluation Runs ─────────────────────────────────────────

export async function startEvaluation(formData: FormData) {
  await requireAuth();

  const name = (formData.get("name") as string)?.trim() || undefined;

  try {
    const result = await runEvaluation(name);
    revalidatePath("/dashboard/evaluation");
    return { success: true, runId: result.runId, metrics: result.metrics };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation failed";
    return { error: message };
  }
}

export async function fetchEvaluationRuns() {
  await requireAuth();
  return getEvaluationRuns();
}

export async function fetchEvaluationRun(runId: string) {
  await requireAuth();
  return getEvaluationRun(runId);
}

export async function removeEvaluationRun(runId: string) {
  await requireAuth();
  await deleteEvaluationRun(runId);
  revalidatePath("/dashboard/evaluation");
  return { success: true };
}
