import { getAppConfig } from "@/lib/app-config";
import ConfigForm from "./ConfigForm";

export default async function ConfigPage() {
  const config = await getAppConfig();
  const envBearerToken = process.env.BEARER_TOKEN || "";
  const envOpenaiApiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || "";
  const envBaseUrl =
    process.env.BASE_URL || process.env.STRIX_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "";

  return (
    <div>
      <h1 className="text-xl font-semibold text-stone-900 mb-6">Bot Configuration</h1>
      <ConfigForm
        config={config || null}
        envBearerToken={envBearerToken}
        envOpenaiApiKey={envOpenaiApiKey}
        envBaseUrl={envBaseUrl}
      />
    </div>
  );
}
