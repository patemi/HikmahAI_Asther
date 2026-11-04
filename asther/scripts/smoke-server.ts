import "dotenv/config";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { migrate } from "./migrate";
const namespace = "hikmah_test_" + randomUUID().replaceAll("-", "");
const client = postgres(process.env.DATABASE_URL!, {
  max: 1,
  onnotice: () => {},
});
let child: ReturnType<typeof Bun.spawn> | undefined;
const provider = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  async fetch(request) {
    const input = (await request.json()) as {
      stream?: boolean;
      model?: string;
      messages?: Array<{ content?: string }>;
    };
    if (new URL(request.url).pathname.endsWith("/embeddings"))
      return Response.json({
        object: "list",
        data: [
          {
            object: "embedding",
            index: 0,
            embedding: [1, ...Array(1023).fill(0)],
          },
        ],
        model: input.model,
        usage: { prompt_tokens: 10, total_tokens: 10 },
      });
    if (!input.stream)
      return Response.json({
        id: "smoke-completion",
        object: "chat.completion",
        created: 0,
        model: input.model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: input.messages?.[0]?.content?.includes("classifier")
                ? '{"allowed":true,"reason":"smoke test"}'
                : "Jawaban pengujian berdasarkan dokumen contoh [1].",
            },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
      });
    const event = (value: unknown) => "data: " + JSON.stringify(value) + "\n\n";
    let cancelled = false;
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        const pieces = "Jawaban pengujian berdasarkan dokumen contoh [1].".match(/.{1,5}/g) || [];
        let index = 0;
        function emit() {
          if (cancelled) return;
          try {
            if (index < pieces.length) {
              controller.enqueue(encoder.encode(event({ id: "smoke", object: "chat.completion.chunk", created: 0, model: input.model, choices: [{ index: 0, delta: { content: pieces[index++] }, finish_reason: null }] })));
              setTimeout(emit, 300);
            } else {
              controller.enqueue(encoder.encode(event({ id: "smoke", object: "chat.completion.chunk", created: 0, model: input.model, choices: [], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 } }) + "data: [DONE]\n\n"));
              controller.close();
            }
          } catch { cancelled = true; }
        }
        emit();
      },
      cancel() { cancelled = true; },
    });
    return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
  },
});
try {
  await client.unsafe('CREATE SCHEMA "' + namespace + '"');
  await migrate(client, namespace);
  await client.begin(async (tx) => {
    await tx.unsafe('SET LOCAL search_path TO "' + namespace + '", public');
    const hash = await bcrypt.hash("smoke-only-password-123", 4);
    await tx.unsafe(
      "INSERT INTO users(email,password_hash,name,role) VALUES ($1,$2,'Pengelola Uji','admin'),($3,$2,'Pembaca Uji','user')",
      ["admin@example.test", hash, "reader@example.test"],
    );
    await tx.unsafe(
      "INSERT INTO app_config(bot_name,text_model,image_model,embedding_model,rag_enabled,citation_strict) VALUES ('HikmahAI','test-chat','test-chat','test-embedding',true,true)",
    );
    const [doc] = await tx.unsafe(
      "INSERT INTO knowledge_documents(title,content,source,author,locator,status,reviewed_by,reviewed_at) VALUES ('Dokumen contoh pengujian','Zakat adalah topik dalam dokumen contoh pengujian antarmuka.','https://example.test/source','Penulis Contoh','Bab Contoh','published','Peninjau Contoh',now()) RETURNING id",
    );
    await tx.unsafe(
      "INSERT INTO knowledge_chunks(document_id,content,chunk_index) VALUES ($1,'Zakat adalah topik dalam dokumen contoh pengujian antarmuka.',0)",
      [doc.id],
    );
  });
  child = Bun.spawn(["node", "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_SCHEMA: namespace,
      LLM_MODEL: "test-chat",
      STRIX_LLM: "",
      LLM_API_KEY: "smoke-only-key",
      OPENAI_API_KEY: "smoke-only-key",
      GEMINI_API_KEY: "smoke-only-key",
      LLM_API_BASE: provider.url.toString(),
      CHAT_RETENTION_DAYS: "0",
    },
    stdout: "inherit",
    stderr: "inherit",
  });
  console.log("Isolated UI verification server: http://localhost:3100 (press Enter to stop and clean up)");
  await Promise.race([
    child.exited,
    new Promise<void>((resolve) => {
      process.stdin.once("data", () => resolve());
      process.stdin.resume();
      process.once("SIGINT", resolve);
      process.once("SIGTERM", resolve);
    }),
  ]);
} finally {
  if (child) {
    child.kill();
    await child.exited;
  }
  provider.stop(true);
  if (/^hikmah_test_[a-f0-9]{32}$/.test(namespace))
    await client.unsafe('DROP SCHEMA IF EXISTS "' + namespace + '" CASCADE');
  await client.end();
  process.stdin.pause();
  console.log("UI verification data removed.");
}
