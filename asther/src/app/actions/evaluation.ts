"use server";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import {
  runEvaluation,
  getEvaluationRun,
  getEvaluationRuns,
  deleteEvaluationRun,
} from "@/lib/evaluation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { consumeLimit } from "@/lib/limits";
const testSchema = z.object({
  query: z.string().trim().min(1).max(8000),
  category: z.string().trim().max(100).optional(),
  referenceAnswer: z.string().trim().max(12000).optional(),
  expectedDocumentIds: z.array(z.uuid()).max(30).default([]),
  expectedBehavior: z
    .enum(["answer", "abstain", "out_of_scope"])
    .default("answer"),
});
function refresh() {
  revalidatePath("/dashboard/evaluation");
}
export async function getTestCases() {
  await requireAdmin();
  return db.query.evaluationTestCases.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 100,
  });
}
export async function addTestCase(form: FormData) {
  const admin = await requireAdmin();
  const parsed = testSchema.safeParse({
    query: form.get("query"),
    category: form.get("category") || undefined,
    referenceAnswer: form.get("referenceAnswer") || undefined,
    expectedDocumentIds: String(form.get("expectedDocumentIds") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
    expectedBehavior: form.get("expectedBehavior") || "answer",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (form.get("reviewed") !== "on")
    return { error: "Konfirmasi peninjauan kasus uji terlebih dahulu." };
  if (parsed.data.expectedBehavior === "answer" && !parsed.data.referenceAnswer)
    return { error: "Jawaban acuan wajib diisi." };
  const data = {
    ...parsed.data,
    reviewedBy: admin.name || admin.email,
    reviewedAt: new Date(),
  };
  const id = form.get("id");
  if (id) {
    if (!z.uuid().safeParse(id).success)
      return { error: "ID kasus tidak valid." };
    await db
      .update(schema.evaluationTestCases)
      .set(data)
      .where(eq(schema.evaluationTestCases.id, String(id)));
  } else await db.insert(schema.evaluationTestCases).values(data);
  refresh();
  return { success: true };
}
export async function deleteTestCase(id: string) {
  await requireAdmin();
  z.uuid().parse(id);
  await db
    .delete(schema.evaluationTestCases)
    .where(eq(schema.evaluationTestCases.id, id));
  refresh();
}
export async function importTestCases(input: unknown) {
  await requireAdmin();
  const parsed = z.array(testSchema).min(1).max(50).safeParse(input);
  if (!parsed.success)
    return {
      error:
        "JSON harus berisi maksimal 50 kasus dengan query dan ID dokumen yang valid.",
    };
  await db.insert(schema.evaluationTestCases).values(parsed.data);
  refresh();
  return { success: true, imported: parsed.data.length };
}
export async function startEvaluation(form: FormData) {
  const admin = await requireAdmin();
  try {
    await consumeLimit("evaluation", admin.id, 1, 600);
    const result = await runEvaluation(
      String(form.get("name") || "")
        .trim()
        .slice(0, 200) || undefined,
    );
    refresh();
    return { success: true, ...result };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Evaluasi gagal.",
    };
  }
}
export async function fetchEvaluationRuns() {
  await requireAdmin();
  return getEvaluationRuns();
}
export async function fetchEvaluationRun(id: string) {
  await requireAdmin();
  z.uuid().parse(id);
  return getEvaluationRun(id);
}
export async function removeEvaluationRun(id: string) {
  await requireAdmin();
  z.uuid().parse(id);
  await deleteEvaluationRun(id);
  refresh();
}
