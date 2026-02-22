"use client";

import { useState } from "react";
import { createDocument, updateDocument, removeDocument } from "@/app/actions/knowledge";
import type { KnowledgeDocument } from "@/lib/db/schema";

interface KnowledgeClientProps {
  documents: KnowledgeDocument[];
}

export default function KnowledgeClient({ documents }: KnowledgeClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const result = await createDocument(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Document created and indexed successfully!" });
      setShowForm(false);
    }

    setLoading(false);
  }

  async function handleUpdate(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const result = await updateDocument(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Document updated and re-indexed successfully!" });
      setEditingDoc(null);
    }

    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;

    setLoading(true);
    const result = await removeDocument(id);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Document deleted successfully!" });
    }

    setLoading(false);
  }

  const inputClass = "w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1.5";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">Knowledge Base</h1>
          <p className="text-stone-500 text-sm mt-1">Manage documents for RAG-powered responses</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/dashboard/knowledge/upload"
            className="px-4 py-2 border border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-50 text-sm font-medium rounded-md"
          >
            Upload JSON
          </a>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingDoc(null);
            }}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-md"
          >
            {showForm ? "Cancel" : "Add Document"}
          </button>
        </div>
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

      {showForm && (
        <div className="bg-white rounded-lg p-5 border border-stone-200 mb-6">
          <h2 className="text-base font-semibold text-stone-900 mb-4">Add New Document</h2>
          <form action={handleCreate} className="space-y-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                name="title"
                required
                suppressHydrationWarning
                className={inputClass}
                placeholder="Document title"
              />
            </div>
            <div>
              <label className={labelClass}>Source URL (optional)</label>
              <input
                type="text"
                name="source"
                suppressHydrationWarning
                className={inputClass}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className={labelClass}>Content *</label>
              <textarea
                name="content"
                required
                rows={10}
                suppressHydrationWarning
                className={inputClass}
                placeholder="Paste your document content here..."
              />
              <p className="text-stone-500 text-xs mt-1">
                The content will be automatically chunked for RAG retrieval.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-medium rounded-md text-sm"
              >
                {loading ? "Processing..." : "Add Document"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingDoc && (
        <div className="bg-white rounded-lg p-5 border border-stone-200 mb-6">
          <h2 className="text-base font-semibold text-stone-900 mb-4">Edit Document</h2>
          <form action={handleUpdate} className="space-y-4">
            <input type="hidden" name="documentId" value={editingDoc.id} />
            <div>
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                name="title"
                required
                defaultValue={editingDoc.title}
                suppressHydrationWarning
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Source URL (optional)</label>
              <input
                type="text"
                name="source"
                defaultValue={editingDoc.source || ""}
                suppressHydrationWarning
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Content *</label>
              <textarea
                name="content"
                required
                rows={10}
                defaultValue={editingDoc.content}
                suppressHydrationWarning
                className={inputClass}
              />
              <p className="text-stone-500 text-xs mt-1">
                Updating content will re-chunk and re-index the document.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 border border-stone-300 rounded-md text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-medium rounded-md text-sm"
              >
                {loading ? "Updating..." : "Update Document"}
              </button>
            </div>
          </form>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg p-12 border border-stone-200 text-center">
          <p className="text-stone-500 mb-2">No documents in the knowledge base yet.</p>
          <p className="text-stone-400 text-sm">
            Add documents to enable RAG-powered responses.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-md"
          >
            Add Your First Document
          </button>
          <a
            href="/dashboard/knowledge/upload"
            className="mt-2 inline-block px-4 py-2 border border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-50 text-sm font-medium rounded-md"
          >
            Upload JSON Documents
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg p-5 border border-stone-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-stone-900">{doc.title}</h3>
                  {doc.source && (
                    <a
                      href={doc.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-500 text-sm hover:underline truncate block"
                    >
                      {doc.source}
                    </a>
                  )}
                  <p className="text-stone-500 text-sm mt-2 line-clamp-2">
                    {doc.content}
                  </p>
                  <p className="text-stone-400 text-xs mt-2">
                    Added: {new Date(doc.createdAt).toLocaleDateString()}
                    {doc.updatedAt > doc.createdAt && (
                      <> · Updated: {new Date(doc.updatedAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingDoc(doc);
                      setShowForm(false);
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 border border-stone-300 rounded-md hover:bg-stone-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
