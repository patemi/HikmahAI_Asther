import "dotenv/config";
import postgres from "postgres";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export async function migrate(client: postgres.Sql, namespace = "public") {
  if (!/^[a-z_][a-z0-9_]*$/.test(namespace))
    throw new Error("Invalid database schema.");
  const folder = join(import.meta.dir, "../drizzle");
  const journal = JSON.parse(
    await readFile(join(folder, "meta/_journal.json"), "utf8"),
  ) as { entries: Array<{ tag: string }> };
  await client.begin(async (tx) => {
    await tx.unsafe('SET LOCAL search_path TO "' + namespace + '", public');
    await tx.unsafe(
      "SELECT pg_advisory_xact_lock(hashtext('hikmah-migrations'))",
    );
    await tx.unsafe(
      'CREATE TABLE IF NOT EXISTS "_hikmah_migrations" (tag text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    for (const { tag } of journal.entries) {
      const applied = await tx.unsafe(
        'SELECT tag FROM "_hikmah_migrations" WHERE tag = $1',
        [tag],
      );
      if (applied.length) continue;
      const source = await readFile(join(folder, tag + ".sql"), "utf8");
      for (let statement of source
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean)) {
        statement = statement
          .replace(/"public"\./g, '"' + namespace + '".')
          .replace(/^CREATE TABLE /, "CREATE TABLE IF NOT EXISTS ")
          .replace(
            /^CREATE (UNIQUE )?INDEX /,
            (_, unique) => "CREATE " + (unique || "") + "INDEX IF NOT EXISTS ",
          )
          .replace(
            /ADD COLUMN (?!IF NOT EXISTS)/g,
            "ADD COLUMN IF NOT EXISTS ",
          );
        const constraint = statement.match(/ADD CONSTRAINT "([^"]+)"/);
        if (constraint) {
          const existing = await tx.unsafe(
            "SELECT 1 FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE c.conname=$1 AND n.nspname=$2",
            [constraint[1], namespace],
          );
          if (existing.length) continue;
        }
        await tx.unsafe(statement);
      }
      await tx.unsafe('INSERT INTO "_hikmah_migrations" (tag) VALUES ($1)', [
        tag,
      ]);
    }
  });
}
if (import.meta.main) {
  const client = postgres(process.env.DATABASE_URL!, {
    max: 1,
    connect_timeout: 5,
  });
  try {
    await migrate(client);
    console.log(
      "Database migrations completed without deleting existing data.",
    );
  } catch (error) {
    console.error(
      "Migration failed. No partial migration was committed.",
      error instanceof Error
        ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]")
        : "Unknown error",
    );
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
