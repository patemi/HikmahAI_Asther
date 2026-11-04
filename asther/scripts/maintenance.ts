import "dotenv/config";
import { runMaintenance } from "../src/lib/maintenance";
try {
  await runMaintenance();
  console.log("Maintenance completed.");
} catch {
  console.error("Maintenance failed.");
  process.exitCode = 1;
}
process.exit(process.exitCode || 0);
