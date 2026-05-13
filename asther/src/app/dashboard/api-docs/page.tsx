import { headers } from "next/headers";
import { getAppConfig } from "@/lib/app-config";
import ApiDocsClient from "./ApiDocsClient";

export default async function ApiDocsPage() {
  const config = await getAppConfig();
  const headerList = await headers();
  const forwardedProto = headerList.get("x-forwarded-proto");
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost || headerList.get("host");
  const inferredBaseUrl = host
    ? `${forwardedProto || "http"}://${host}`
    : "http://localhost:5000";

  const baseUrl =
    config?.baseUrl?.trim() ||
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    inferredBaseUrl;

  const bearerToken = process.env.BEARER_TOKEN || "YOUR_API_KEY";

  return <ApiDocsClient baseUrl={baseUrl} bearerToken={bearerToken} />;
}
