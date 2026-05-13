"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTestCases,
  addTestCase,
  deleteTestCase,
  importTestCases,
  startEvaluation,
  fetchEvaluationRuns,
  fetchEvaluationRun,
  removeEvaluationRun,
} from "@/app/actions/evaluation";

// ─── Types ───────────────────────────────────────────────────

type TestCase = {
  id: string;
  query: string;
  category: string | null;
  expectedDocumentIds: string[] | null;
  createdAt: Date;
};

type EvalRun = {
  id: string;
  name: string | null;
  totalQueries: number;
  avgPrecision: string;
  avgRecall: string;
  avgF1Score: string;
  avgRelevanceScore: string;
  avgAccuracy: string;
  configSnapshot: unknown;
  createdAt: Date;
};

type QueryResult = {
  id: string;
  query: string;
  category: string | null;
  precision: string;
  recall: string;
  f1Score: string;
  relevanceScore: string;
  accuracy: string;
  retrievedChunks: number;
  relevantChunks: number;
  totalExpectedRelevant: number | null;
  chunkDetails: Array<{
    chunkId: string;
    documentTitle: string;
    similarity: number;
    llmRelevanceRating: number;
    isRelevant: boolean;
    judgeFailed?: boolean;
  }> | null;
  llmAccuracyRating: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────

function pct(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `${(n * 100).toFixed(1)}%`;
}

function scoreColor(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (n >= 0.8) return "text-emerald-600 dark:text-emerald-400";
  if (n >= 0.6) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (n >= 0.8) return "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800";
  if (n >= 0.6) return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800";
  return "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800";
}

// ─── Component ───────────────────────────────────────────────

export default function EvaluationClient() {
  const [tab, setTab] = useState<"runs" | "testcases">("runs");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [runs, setRuns] = useState<EvalRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<{
    run: EvalRun;
    queryResults: QueryResult[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningEval, setRunningEval] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tc, r] = await Promise.all([getTestCases(), fetchEvaluationRuns()]);
      setTestCases(tc as TestCase[]);
      setRuns(r as EvalRun[]);
    } catch {
      setMessage({ type: "error", text: "Failed to load data" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ─── Test Case Handlers ─────────────────────────────────

  async function handleAddTestCase(formData: FormData) {
    const result = await addTestCase(formData);
    if (result.error) {
      showMessage("error", result.error);
    } else {
      showMessage("success", "Test case added");
      loadData();
    }
  }

  async function handleDeleteTestCase(id: string) {
    await deleteTestCase(id);
    showMessage("success", "Test case deleted");
    loadData();
  }

  async function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const cases = Array.isArray(data) ? data : [data];
      const result = await importTestCases(cases);
      if (result.success) {
        showMessage("success", `Imported ${result.imported} test cases`);
        loadData();
      }
    } catch {
      showMessage("error", "Invalid JSON file");
    }
    e.target.value = "";
  }

  // ─── Evaluation Run Handlers ────────────────────────────

  async function handleRunEvaluation(formData: FormData) {
    setRunningEval(true);
    setMessage(null);

    try {
      const result = await startEvaluation(formData);
      if (result.error) {
        showMessage("error", result.error);
      } else {
        showMessage("success", "Evaluation completed!");
        loadData();
      }
    } catch {
      showMessage("error", "Evaluation failed unexpectedly");
    }

    setRunningEval(false);
  }

  async function handleViewRun(runId: string) {
    setLoading(true);
    try {
      const result = await fetchEvaluationRun(runId);
      if (result) {
        setSelectedRun(result as { run: EvalRun; queryResults: QueryResult[] });
      }
    } catch {
      showMessage("error", "Failed to load run details");
    }
    setLoading(false);
  }

  async function handleDeleteRun(runId: string) {
    await removeEvaluationRun(runId);
    showMessage("success", "Evaluation run deleted");
    if (selectedRun?.run.id === runId) setSelectedRun(null);
    loadData();
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            RAG Evaluation
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Measure retrieval quality with precision, recall, F1-score, accuracy, and relevance metrics.
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-stone-200 dark:border-stone-700">
        <button
          onClick={() => { setTab("runs"); setSelectedRun(null); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "runs"
              ? "border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100"
              : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          Evaluation Runs
        </button>
        <button
          onClick={() => { setTab("testcases"); setSelectedRun(null); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "testcases"
              ? "border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100"
              : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          Test Cases ({testCases.length})
        </button>
      </div>

      {/* ─── Runs Tab ───────────────────────────────────── */}
      {tab === "runs" && !selectedRun && (
        <div>
          {/* Run Evaluation Form */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5 mb-6">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">
              Run New Evaluation
            </h2>
            <form action={handleRunEvaluation} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1">
                  Run Name (optional)
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. After adding Hadith documents"
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400"
                />
              </div>
              <button
                type="submit"
                disabled={runningEval || testCases.length === 0}
                className="px-5 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium rounded-md hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {runningEval ? "Evaluating..." : "Run Evaluation"}
              </button>
            </form>
            {testCases.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Add test cases first before running an evaluation.
              </p>
            )}
            {runningEval && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                This may take a while — each query is evaluated by the LLM judge. Do not close this page.
              </p>
            )}
          </div>

          {/* Past Runs */}
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">
            Past Runs
          </h2>
          {runs.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-8 text-center text-sm text-stone-500 dark:text-stone-400">
              No evaluation runs yet. Add test cases and run your first evaluation.
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {run.name || "Unnamed Run"}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {run.totalQueries} queries · {new Date(run.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewRun(run.id)}
                        className="text-xs px-3 py-1.5 border border-stone-300 dark:border-stone-600 rounded-md text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleDeleteRun(run.id)}
                        className="text-xs px-3 py-1.5 border border-stone-300 dark:border-stone-600 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {/* Metrics summary */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "Precision", value: run.avgPrecision },
                      { label: "Recall", value: run.avgRecall },
                      { label: "F1 Score", value: run.avgF1Score },
                      { label: "Relevance", value: run.avgRelevanceScore },
                      { label: "Accuracy", value: run.avgAccuracy },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className={`px-3 py-2 rounded-md border text-center ${scoreBg(m.value)}`}
                      >
                        <div className={`text-lg font-bold ${scoreColor(m.value)}`}>
                          {pct(m.value)}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider mt-0.5">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Run Detail View ────────────────────────────── */}
      {tab === "runs" && selectedRun && (
        <div>
          <button
            onClick={() => setSelectedRun(null)}
            className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mb-4 flex items-center gap-1"
          >
            ← Back to runs
          </button>

          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5 mb-6">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
              {selectedRun.run.name || "Unnamed Run"}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              {selectedRun.run.totalQueries} queries · {new Date(selectedRun.run.createdAt).toLocaleString()}
            </p>

            {/* Aggregate Metrics */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {[
                { label: "Avg Precision", value: selectedRun.run.avgPrecision, desc: "Relevant / Retrieved" },
                { label: "Avg Recall", value: selectedRun.run.avgRecall, desc: "Retrieved / Total Relevant" },
                { label: "Avg F1 Score", value: selectedRun.run.avgF1Score, desc: "Harmonic mean P & R" },
                { label: "Avg Relevance", value: selectedRun.run.avgRelevanceScore, desc: "LLM relevance rating" },
                { label: "Avg Accuracy", value: selectedRun.run.avgAccuracy, desc: "Answer correctness" },
              ].map((m) => (
                <div
                  key={m.label}
                  className={`px-4 py-3 rounded-lg border ${scoreBg(m.value)}`}
                >
                  <div className={`text-2xl font-bold ${scoreColor(m.value)}`}>
                    {pct(m.value)}
                  </div>
                  <div className="text-xs font-medium text-stone-700 dark:text-stone-300 mt-1">{m.label}</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400">{m.desc}</div>
                </div>
              ))}
            </div>

            {/* Per-query results */}
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">
              Per-Query Results
            </h3>
            <div className="space-y-3">
              {selectedRun.queryResults.map((qr) => (
                <QueryResultCard key={qr.id} result={qr} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Test Cases Tab ─────────────────────────────── */}
      {tab === "testcases" && (
        <div>
          {/* Add Test Case */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5 mb-6">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-3">
              Add Test Case
            </h2>
            <form action={handleAddTestCase} className="space-y-3">
              <div>
                <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1">Query *</label>
                <input
                  name="query"
                  type="text"
                  required
                  placeholder="e.g. Apa hukum sholat tahajud?"
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400"
                  >
                    <option value="">Uncategorized</option>
                    <option value="quran">Quran</option>
                    <option value="hadith">Hadith</option>
                    <option value="fiqh">Fiqh</option>
                    <option value="aqidah">Aqidah</option>
                    <option value="history">Sejarah Islam</option>
                    <option value="akhlak">Akhlak & Adab</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-stone-500 dark:text-stone-400 mb-1">
                    Expected Document IDs (comma-separated, optional)
                  </label>
                  <input
                    name="expectedDocumentIds"
                    type="text"
                    placeholder="uuid1, uuid2"
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-md text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium rounded-md hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
              >
                Add Test Case
              </button>
            </form>
          </div>

          {/* Import */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-stone-500 dark:text-stone-400">
              Import from JSON:
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="text-xs text-stone-600 dark:text-stone-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border file:border-stone-300 dark:file:border-stone-600 file:text-xs file:font-medium file:bg-white dark:file:bg-stone-800 file:text-stone-700 dark:file:text-stone-300 file:cursor-pointer"
            />
          </div>

          {/* Test Case List */}
          {testCases.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-8 text-center text-sm text-stone-500 dark:text-stone-400">
              No test cases yet. Add queries above or import a JSON file.
              <div className="mt-3 text-xs text-stone-400 dark:text-stone-500">
                JSON format: {`[{"query": "...", "category": "fiqh", "expectedDocumentIds": ["uuid1"]}]`}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {testCases.map((tc) => (
                <div
                  key={tc.id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-stone-900 dark:text-stone-100 truncate">
                      {tc.query}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {tc.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium uppercase">
                          {tc.category}
                        </span>
                      )}
                      {tc.expectedDocumentIds && tc.expectedDocumentIds.length > 0 && (
                        <span className="text-[10px] text-stone-400 dark:text-stone-500">
                          {tc.expectedDocumentIds.length} expected doc(s)
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTestCase(tc.id)}
                    className="ml-3 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/10 dark:bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-6 py-4 text-sm text-stone-700 dark:text-stone-300">
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-component: Query Result Card ────────────────────────

function QueryResultCard({ result }: { result: QueryResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="text-sm text-stone-900 dark:text-stone-100 truncate">
            {result.query}
          </div>
          <div className="flex items-center gap-3 mt-1">
            {result.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium uppercase">
                {result.category}
              </span>
            )}
            <span className="text-[10px] text-stone-400 dark:text-stone-500">
              {result.retrievedChunks} chunks · {result.relevantChunks} relevant
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {[
            { label: "P", value: result.precision },
            { label: "R", value: result.recall },
            { label: "F1", value: result.f1Score },
            { label: "Rel", value: result.relevanceScore },
            { label: "Acc", value: result.accuracy },
          ].map((m) => (
            <div key={m.label} className="text-center min-w-[40px]">
              <div className={`text-xs font-bold ${scoreColor(m.value)}`}>
                {pct(m.value)}
              </div>
              <div className="text-[9px] text-stone-400 dark:text-stone-500">{m.label}</div>
            </div>
          ))}
          <span className="ml-2 text-stone-400 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-100 dark:border-stone-800">
          {/* Accuracy Explanation */}
          {result.llmAccuracyRating && (
            <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-md">
              <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
                Accuracy Assessment
              </div>
              <div className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {result.llmAccuracyRating}
              </div>
            </div>
          )}

          {/* Chunk Details */}
          {result.chunkDetails && result.chunkDetails.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                Retrieved Chunks
              </div>
              <div className="space-y-2">
                {result.chunkDetails.map((chunk, i) => (
                  <div
                    key={chunk.chunkId}
                    className={`flex items-center justify-between px-3 py-2 rounded-md border text-xs ${
                      chunk.isRelevant
                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : "bg-stone-50 border-stone-200 dark:bg-stone-800/50 dark:border-stone-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-mono text-[10px] ${chunk.isRelevant ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400"}`}>
                        #{i + 1}
                      </span>
                      <span className="text-stone-700 dark:text-stone-300 truncate">
                        {chunk.documentTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="text-stone-500 dark:text-stone-400">
                        Sim: {(chunk.similarity * 100).toFixed(1)}%
                      </span>
                      <span className={scoreColor(chunk.llmRelevanceRating)}>
                        LLM: {(chunk.llmRelevanceRating * 100).toFixed(1)}%
                      </span>
                      {chunk.judgeFailed && (
                        <span className="text-amber-500 dark:text-amber-400" title="LLM judge failed, using similarity score">
                          ⚠ fallback
                        </span>
                      )}
                      <span className={`font-medium ${chunk.isRelevant ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400"}`}>
                        {chunk.isRelevant ? "✓ Relevant" : "✗ Not relevant"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
