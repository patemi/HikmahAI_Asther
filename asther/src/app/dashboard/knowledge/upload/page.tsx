import { requireAdminPage } from "@/lib/auth";
import JsonUploadClient from "./JsonUploadClient";

export default async function KnowledgeUploadPage() {
  await requireAdminPage();
  return <JsonUploadClient />;
}
