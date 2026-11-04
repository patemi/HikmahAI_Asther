import { requireAdminPage } from "@/lib/auth";
import { headers } from "next/headers";
import ApiDocsClient from "./ApiDocsClient";

export default async function ApiDocsPage() {
  await requireAdminPage();
  const headerList = await headers();
  const forwardedProto = headerList.get("x-forwarded-proto");
  const forwardedHost = headerList.get("x-forwarded-host");
  const host = forwardedHost || headerList.get("host");
  const inferredBaseUrl = host
    ? `${forwardedProto || "http"}://${host}`
    : "http://localhost:5000";

  const baseUrl =
    process.env.APP_URL ||
    inferredBaseUrl;

  const bearerToken = "YOUR_API_KEY";

  return <ApiDocsClient baseUrl={baseUrl} bearerToken={bearerToken} />;
}
