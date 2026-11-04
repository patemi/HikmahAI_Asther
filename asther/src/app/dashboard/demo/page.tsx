import { requireAdminPage } from "@/lib/auth";
import DemoClient from "./DemoClient";

export default async function DemoPage() {
  await requireAdminPage();

  return <DemoClient />;
}
