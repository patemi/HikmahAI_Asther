"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    // Try a simple query to check connection
    await db.execute(sql`SELECT 1`);
    return { connected: true };
  } catch (error: unknown) {
    console.error("Database connection check failed:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
      return { connected: false, error: "Database tables not initialized. Run migrations." };
    }
    if (errorMessage.includes("connect") || errorMessage.includes("ECONNREFUSED")) {
      return { connected: false, error: "Cannot connect to database server." };
    }
    if (errorMessage.includes("does not exist") && errorMessage.includes("database")) {
      return { connected: false, error: "Database does not exist." };
    }
    if (errorMessage.includes("authentication failed")) {
      return { connected: false, error: "Database authentication failed." };
    }
    
    return { connected: false, error: "Database connection failed." };
  }
}
