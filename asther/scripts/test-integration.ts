import "dotenv/config";
import postgres from "postgres";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { migrate } from "./migrate";
const namespace = "hikmah_test_" + randomUUID().replaceAll("-", "");
const client = postgres(process.env.DATABASE_URL!, {
  max: 1,
  connect_timeout: 5,
  onnotice: () => {},
});
try {
  await client.unsafe('CREATE SCHEMA "' + namespace + '"');
  await migrate(client, namespace);
  await migrate(client, namespace);
  const legacy = namespace + "_legacy";
  await client.unsafe('CREATE SCHEMA "' + legacy + '"');
  try {
    const baseline = await readFile(
      new URL("../drizzle/0000_handy_thunderbolt_ross.sql", import.meta.url),
      "utf8",
    );
    await client.begin(async (tx) => {
      await tx.unsafe('SET LOCAL search_path TO "' + legacy + '", public');
      for (const statement of baseline
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean))
        await tx.unsafe(statement.replace(/"public"\./g, '"' + legacy + '".'));
      await tx.unsafe(
        "INSERT INTO users(email,password_hash) VALUES ('legacy@example.test','test-only-hash')",
      );
      await tx.unsafe(
        "INSERT INTO knowledge_documents(title,content) VALUES ('Preserved legacy document','Preserved content')",
      );
    });
    await migrate(client, legacy);
    const [preserved] = await client.unsafe(
      'SELECT (SELECT count(*) FROM "' +
        legacy +
        "\".users WHERE role='user')::int AS users, (SELECT count(*) FROM \"" +
        legacy +
        "\".knowledge_documents WHERE content='Preserved content' AND status='draft')::int AS documents",
    );
    if (preserved.users !== 1 || preserved.documents !== 1)
      throw new Error("Legacy migration did not preserve data.");
    console.log("Fresh, repeated, and legacy database migrations verified.");
  } finally {
    await client.unsafe('DROP SCHEMA "' + legacy + '" CASCADE');
  } // Also verify repeated deployment is idempotent.
  const child = Bun.spawn(
    ["bun", "test", "integration", "--timeout", "30000"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_SCHEMA: namespace,
        LLM_MODEL: "test-chat",
        STRIX_LLM: "",
        EMBEDDING_MODEL: "test-embedding",
        CHAT_RETENTION_DAYS: "0",
      },
      stdout: "inherit",
      stderr: "inherit",
    },
  );
  process.exitCode = await child.exited;
} catch (error) {
  console.error(
    "Isolated database verification failed:",
    error instanceof Error
      ? error.message.replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]")
      : "Unknown error",
  );
  process.exitCode = 1;
} finally {
  if (!/^hikmah_test_[a-f0-9]{32}$/.test(namespace))
    throw new Error("Unsafe test schema name.");
  await client.unsafe('DROP SCHEMA IF EXISTS "' + namespace + '" CASCADE');
  await client.end();
}
