import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create postgres connection
const namespace = process.env.DATABASE_SCHEMA || "public";
if (!/^[a-z_][a-z0-9_]*$/.test(namespace))
  throw new Error("Invalid database schema");
const client = postgres(connectionString, {
  max: 10,
  onnotice: process.env.NODE_ENV === "test" ? () => {} : undefined,
  connect_timeout: 5,
  idle_timeout: 20,
  connection: { search_path: namespace + ",public" },
});

// Create drizzle database instance
export const db = drizzle(client, { schema });

export { schema };
