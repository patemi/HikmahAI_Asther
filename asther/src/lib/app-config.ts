import { db } from "@/lib/db";
// Schema changes are applied by the deployment migration, never by a page read.
export async function getAppConfig() {
  return db.query.appConfig.findFirst();
}
