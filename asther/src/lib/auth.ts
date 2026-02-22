import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const SESSION_COOKIE_NAME = "asther_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Get current session
export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.id, sessionId),
    with: {
      // We don't have relations set up, so we'll query user separately
    },
  });

  if (!session || session.expiresAt < new Date()) {
    // Session expired or not found
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.userId),
  });

  return user;
}

// Create session for user
export async function createSession(userId: string) {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(schema.sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return sessionId;
}

// Delete session (logout)
export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

// Login user
export async function loginUser(email: string, password: string) {
  console.log(`[LOGIN] Attempting login for: ${email}`);
  try {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    console.log(`[LOGIN] User found: ${user ? 'yes' : 'no'}`);
    
    if (!user) {
      return { error: "Invalid email or password" };
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    console.log(`[LOGIN] Password valid: ${validPassword}`);
    
    if (!validPassword) {
      return { error: "Invalid email or password" };
    }

    await createSession(user.id);
    console.log(`[LOGIN] Session created for user: ${user.id}`);
    return { user };
  } catch (error: unknown) {
    console.error("[LOGIN] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check for common database connection errors
    if (errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
      return { error: "Database tables not initialized. Please run migrations." };
    }
    if (errorMessage.includes("connect") || errorMessage.includes("ECONNREFUSED")) {
      return { error: "Cannot connect to database. Please check database connection." };
    }
    if (errorMessage.includes("authentication failed")) {
      return { error: "Database authentication failed. Check credentials." };
    }
    
    return { error: "An unexpected error occurred. Please try again." };
  }
}

// Register user
export async function registerUser(
  email: string,
  password: string,
  name?: string
) {
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (existingUser) {
    return { error: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(schema.users)
    .values({
      email,
      passwordHash,
      name,
    })
    .returning();

  await createSession(user.id);
  return { user };
}

// Verify API bearer token
export async function verifyApiToken(token: string) {
  const config = await db.query.appConfig.findFirst();

  if (!config?.apiKeyHash) {
    // No API key configured, use env fallback
    return token === process.env.BEARER_TOKEN;
  }

  return bcrypt.compare(token, config.apiKeyHash);
}

// Initialize default user if none exists
export async function initializeDefaultUser() {
  const existingUser = await db.query.users.findFirst();

  if (!existingUser) {
    const email = process.env.DEFAULT_USERNAME || "admin";
    const password = process.env.DEFAULT_PASSWORD || "admin";

    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(schema.users).values({
      email,
      passwordHash,
      name: "Admin",
    });

    console.log(`Created default user: ${email}`);
  }
}

// Initialize default app config if none exists
export async function initializeAppConfig() {
  const existingConfig = await db.query.appConfig.findFirst();

  if (!existingConfig) {
    // Hash the bearer token from env
    const bearerToken = process.env.BEARER_TOKEN || "changeme";
    const apiKeyHash = await bcrypt.hash(bearerToken, 10);

    await db.insert(schema.appConfig).values({
      apiKeyHash,
    });

    console.log("Created default app config");
  }
}
