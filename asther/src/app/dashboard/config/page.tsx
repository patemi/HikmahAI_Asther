import { requireAdminPage } from "@/lib/auth";
import { getAppConfig } from "@/lib/app-config";
import ConfigForm from "./ConfigForm";
export default async function ConfigPage() {
  await requireAdminPage();
  const config = await getAppConfig();
  if (!config) return <p>Konfigurasi belum diinisialisasi. Jalankan bootstrap aplikasi.</p>;
  const { apiKeyHash, openaiApiKey, geminiApiKey, ...publicConfig } = config;
  return <div><h1 className="mb-6 font-display text-3xl leading-none">Konfigurasi Hikmah AI</h1><ConfigForm config={publicConfig} credentials={{ bearer: Boolean(apiKeyHash || process.env.BEARER_TOKEN), openai: Boolean(openaiApiKey || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY), gemini: Boolean(geminiApiKey || process.env.GEMINI_API_KEY) }} /></div>;
}
