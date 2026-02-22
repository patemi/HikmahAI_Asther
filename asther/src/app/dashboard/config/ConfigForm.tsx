"use client";

import { useState } from "react";
import { updateConfig } from "@/app/actions/config";
import type { AppConfig } from "@/lib/db/schema";
import Toast from "@/components/Toast";

interface ConfigFormProps {
  config: AppConfig | null;
  envBearerToken: string;
  envOpenaiApiKey: string;
  envBaseUrl: string;
}

export default function ConfigForm({ config, envBearerToken, envOpenaiApiKey, envBaseUrl }: ConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const result = await updateConfig(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Configuration saved successfully!" });
    }

    setLoading(false);
  }

  const inputClass = "w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent";
  const selectClass = "w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-stone-700 mb-1.5";

  return (
    <form action={handleSubmit} className="space-y-6">
      {message && (
        <Toast
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot Identity */}
        <div className="bg-white rounded-lg p-5 border border-stone-200">
          <h2 className="text-base font-semibold text-stone-900 mb-4">Bot Identity</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Bot Name</label>
              <input
                type="text"
                name="botName"
                defaultValue={config?.botName || "Ekabot"}
                suppressHydrationWarning
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Bot Personality</label>
              <input
                type="text"
                name="botPersonality"
                defaultValue={config?.botPersonality || "friendly and helpful"}
                placeholder="e.g., friendly and helpful, professional, casual"
                suppressHydrationWarning
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>System Prompt</label>
              <textarea
                name="systemPrompt"
                rows={4}
                defaultValue={config?.systemPrompt || "You are a helpful assistant."}
                suppressHydrationWarning
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Model Settings */}
        <div className="bg-white rounded-lg p-5 border border-stone-200">
          <h2 className="text-base font-semibold text-stone-900 mb-4">Model Settings</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Base URL</label>
              <input
                type="text"
                name="baseUrl"
                defaultValue={config?.baseUrl || ""}
                placeholder={envBaseUrl || "https://your-domain.com"}
                suppressHydrationWarning
                className={inputClass}
              />
              <p className="text-stone-500 text-xs mt-1">
                Leave empty to auto-detect from the request host. Env override: {envBaseUrl ? "BASE_URL" : "(not set)"}
              </p>
            </div>
            <div>
              <label className={labelClass}>OpenAI API Key</label>
              <div className="flex gap-2 mb-1">
                <input
                  type={showOpenaiKey ? "text" : "password"}
                  value={envOpenaiApiKey}
                  readOnly
                  suppressHydrationWarning
                  className={`${inputClass} bg-stone-50 font-mono text-sm flex-1`}
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="px-3 py-2 text-sm text-stone-600 hover:text-stone-900 border border-stone-300 rounded-md hover:bg-stone-50"
                >
                  {showOpenaiKey ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-stone-500 text-xs mb-3">
                Current key from .env file {config?.openaiApiKey && "(DB override active)"}
              </p>
              <input
                type="password"
                name="openaiApiKey"
                placeholder="Enter new key to override"
                suppressHydrationWarning
                className={inputClass}
              />
              <p className="text-stone-500 text-xs mt-1">
                Leave empty to keep using the .env key
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Text Model</label>
              <select
                name="textModel"
                defaultValue={config?.textModel || "gpt-4.1-nano"}
                className={selectClass}
              >
                <option value="gpt-4.1-nano">gpt-4.1-nano</option>
                <option value="gpt-4.1-mini">gpt-4.1-mini</option>
                <option value="gpt-4.1">gpt-4.1</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="meta-llama/llama-3.3-70b-instruct">
                  meta-llama/llama-3.3-70b-instruct
                </option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Image Model</label>
              <select
                name="imageModel"
                defaultValue={config?.imageModel || "gpt-4.1"}
                className={selectClass}
              >
                <option value="gpt-4.1">gpt-4.1</option>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Embedding Model</label>
              <select
                name="embeddingModel"
                defaultValue={config?.embeddingModel || "text-embedding-3-small"}
                className={selectClass}
              >
                <option value="text-embedding-3-small">text-embedding-3-small</option>
                <option value="text-embedding-3-large">text-embedding-3-large</option>
                <option value="text-embedding-ada-002">text-embedding-ada-002</option>
              </select>
              <p className="text-amber-600 text-xs mt-1">
                ⚠️ Changing the embedding model will require re-embedding all knowledge documents
              </p>
            </div>
            </div>
          </div>
        </div>

        {/* RAG Settings */}
        <div className="bg-white rounded-lg p-5 border border-stone-200">
          <h2 className="text-base font-semibold text-stone-900 mb-4">RAG Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ragEnabled"
                name="ragEnabled"
                value="true"
                defaultChecked={config?.ragEnabled || false}
                className="h-4 w-4 text-stone-900 bg-white border-stone-300 rounded focus:ring-stone-900"
              />
              <label htmlFor="ragEnabled" className="ml-2 text-sm text-stone-700">
                Enable RAG (Retrieval Augmented Generation)
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Memory Length</label>
                <input
                  type="number"
                  name="memoryLength"
                  min="1"
                  max="20"
                  defaultValue={config?.memoryLength || 5}
                  suppressHydrationWarning
                  className={inputClass}
                />
                <p className="text-stone-500 text-xs mt-1">
                  Message pairs to include as context
                </p>
              </div>
              <div>
                <label className={labelClass}>Top K Results</label>
                <input
                  type="number"
                  name="ragTopK"
                  min="1"
                  max="20"
                  defaultValue={config?.ragTopK || 5}
                  suppressHydrationWarning
                  className={inputClass}
                />
                <p className="text-stone-500 text-xs mt-1">
                  Number of relevant chunks to retrieve
                </p>
              </div>
              <div>
                <label className={labelClass}>Minimum Score (%)</label>
                <input
                  type="number"
                  name="ragMinScore"
                  min="0"
                  max="100"
                  defaultValue={config?.ragMinScore || 70}
                  suppressHydrationWarning
                  className={inputClass}
                />
                <p className="text-stone-500 text-xs mt-1">
                  Minimum similarity score to include a chunk
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white rounded-lg p-5 border border-stone-200">
          <h2 className="text-base font-semibold text-stone-900 mb-4">API Settings</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Current API Token (from .env)</label>
              <div className="flex gap-2">
                <input
                  type={showToken ? "text" : "password"}
                  value={envBearerToken}
                  readOnly
                  className={`${inputClass} bg-stone-50 font-mono text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="px-3 py-2 text-sm text-stone-600 hover:text-stone-900 border border-stone-300 rounded-md hover:bg-stone-50"
                >
                  {showToken ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-stone-500 text-xs mt-1">
                This is the token from your .env file
              </p>
            </div>
            <div>
              <label className={labelClass}>New API Bearer Token (optional)</label>
              <input
                type="password"
                name="newApiKey"
                placeholder="Leave empty to keep current token"
                suppressHydrationWarning
                className={inputClass}
              />
              <p className="text-stone-500 text-xs mt-1">
                Enter a new bearer token to override the hashed API key in the database
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-medium rounded-md"
        >
          {loading ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </form>
  );
}
