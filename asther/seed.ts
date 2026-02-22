import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./src/lib/db/schema";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if user exists
  const existingUser = await db.query.users.findFirst();
  if (!existingUser) {
    const email = process.env.DEFAULT_USERNAME || "asther";
    const password = process.env.DEFAULT_PASSWORD || "admin";
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(schema.users).values({
      email,
      passwordHash,
      name: "Admin",
    });
    console.log(`✅ Created default user: ${email}`);
  } else {
    console.log("⏭️  User already exists, skipping...");
  }

  // Check if app config exists
  const existingConfig = await db.query.appConfig.findFirst();
  if (!existingConfig) {
    const bearerToken = process.env.BEARER_TOKEN || "changeme";
    const apiKeyHash = await bcrypt.hash(bearerToken, 10);

    await db.insert(schema.appConfig).values({
      botName: "Asther",
      botPersonality: "friendly and helpful",
      systemPrompt: "You are a helpful assistant.",
      apiKeyHash,
      textModel: "gpt-4.1-nano",
      imageModel: "gpt-4.1",
      embeddingModel: "text-embedding-3-small",
      ragEnabled: false,
      ragTopK: 5,
      ragMinScore: 70,
    });
    console.log("✅ Created default app config");
  } else {
    console.log("⏭️  App config already exists, skipping...");
  }

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
