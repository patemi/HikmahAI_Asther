import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";

export default async function DashboardPage() {
  // Get statistics
  const [participantCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.chatParticipants);

  const [messageCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.chatMessages);

  const [documentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.knowledgeDocuments);

  const config = await db.query.appConfig.findFirst();

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900 mb-6 text-balance">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-5 border border-stone-200">
          <h3 className="text-stone-500 text-sm font-medium">Total Participants</h3>
          <p className="text-2xl font-semibold text-stone-900 mt-1 tabular-nums">
            {participantCount?.count || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-stone-200">
          <h3 className="text-stone-500 text-sm font-medium">Total Messages</h3>
          <p className="text-2xl font-semibold text-stone-900 mt-1 tabular-nums">
            {messageCount?.count || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-stone-200">
          <h3 className="text-stone-500 text-sm font-medium">Knowledge Documents</h3>
          <p className="text-2xl font-semibold text-stone-900 mt-1 tabular-nums">
            {documentCount?.count || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg p-5 border border-stone-200">
          <h3 className="text-stone-500 text-sm font-medium">Memory Length</h3>
          <p className="text-2xl font-semibold text-stone-900 mt-1 tabular-nums">
            {config?.memoryLength || 5} <span className="text-base font-normal text-stone-400">pairs</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-5 border border-stone-200">
          <h2 className="text-base font-semibold text-stone-900 mb-4">Bot Configuration</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Bot Name</dt>
              <dd className="text-stone-900 font-medium">{config?.botName || "Asther"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Text Model</dt>
              <dd className="text-stone-900 font-mono text-xs">{config?.textModel || "gpt-4.1-nano"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Image Model</dt>
              <dd className="text-stone-900 font-mono text-xs">{config?.imageModel || "gpt-4.1"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Embedding Model</dt>
              <dd className="text-stone-900 font-mono text-xs">
                {config?.embeddingModel || "text-embedding-3-small"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Memory Length</dt>
              <dd className="text-stone-900 font-mono text-xs">{config?.memoryLength || 5} pairs</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">RAG Status</dt>
              <dd className={config?.ragEnabled ? "text-emerald-600 font-medium" : "text-stone-400"}>
                {config?.ragEnabled ? "Enabled" : "Disabled"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg p-5 border border-stone-200">
          <h2 className="text-base font-semibold text-stone-900 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a
              href="/dashboard/demo"
              className="block p-3 bg-stone-50 rounded-md hover:bg-stone-100 border border-stone-100"
            >
              <span className="text-stone-900 font-medium text-sm">Try Demo</span>
              <p className="text-stone-500 text-xs mt-0.5 text-pretty">
                Test the chatbot and RAG system
              </p>
            </a>
            <a
              href="/dashboard/config"
              className="block p-3 bg-stone-50 rounded-md hover:bg-stone-100 border border-stone-100"
            >
              <span className="text-stone-900 font-medium text-sm">Configure Bot</span>
              <p className="text-stone-500 text-xs mt-0.5 text-pretty">
                Change bot personality, models, and system prompt
              </p>
            </a>
            <a
              href="/dashboard/knowledge"
              className="block p-3 bg-stone-50 rounded-md hover:bg-stone-100 border border-stone-100"
            >
              <span className="text-stone-900 font-medium text-sm">Manage Knowledge</span>
              <p className="text-stone-500 text-xs mt-0.5 text-pretty">
                Add documents for RAG-powered responses
              </p>
            </a>
            <a
              href="/dashboard/api-docs"
              className="block p-3 bg-stone-50 rounded-md hover:bg-stone-100 border border-stone-100"
            >
              <span className="text-stone-900 font-medium text-sm">API Documentation</span>
              <p className="text-stone-500 text-xs mt-0.5 text-pretty">
                Learn how to integrate with your application
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
