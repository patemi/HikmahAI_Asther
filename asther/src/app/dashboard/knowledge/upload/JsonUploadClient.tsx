"use client";

import { useState } from "react";

const MAX_TOTAL_UPLOAD_BYTES = 20 * 1024 * 1024;

export default function JsonUploadClient() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleUpload(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const files = formData
      .getAll("jsonFiles")
      .filter((value): value is File => value instanceof File && value.size > 0);
    const totalBytes = files.reduce((acc, file) => acc + file.size, 0);

    if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      setMessage({
        type: "error",
        text: "Total upload size exceeds 20MB. Please split your files and upload in batches.",
      });
      setLoading(false);
      return;
    }

    const response = await fetch("/api/knowledge/import-json", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({
        type: "success",
        text: `${result.importedCount} document(s) imported from ${result.fileCount} file(s).`,
      });
    }

    setLoading(false);
  }

  const inputClass =
    "w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Upload JSON Documents</h1>
          <p className="text-stone-500 text-sm mt-1">
            Import many JSON files directly into the knowledge base for RAG.
          </p>
        </div>
        <a
          href="/dashboard/knowledge"
          className="px-4 py-2 border border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-50 text-sm font-medium rounded-md"
        >
          Back to Knowledge
        </a>
      </div>

      {message && (
        <div
          className={`mb-6 p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg p-5 border border-stone-200">
        <h2 className="text-base font-semibold text-stone-900 mb-4">Bulk Upload</h2>
        <form action={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              JSON Files
            </label>
            <input
              type="file"
              name="jsonFiles"
              accept=".json,application/json"
              multiple
              required
              suppressHydrationWarning
              className={inputClass}
            />
            <p className="text-stone-500 text-xs mt-1">
              Supported formats: {'{'}title, content{'}'}, {'{'}text{'}'}, array of objects, {'{'}documents/items/data: [...]{'}'}, or generic JSON object.
            </p>
            <p className="text-stone-500 text-xs mt-1">
              Maximum total upload size: 20MB per submit.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-medium rounded-md text-sm"
            >
              {loading ? "Importing..." : "Import JSON Files"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
