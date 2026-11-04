import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { getAppConfig } from "@/lib/app-config";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { HttpError } from "@/lib/http";
import { consumeLimit } from "@/lib/limits";

const SESSION_COOKIE_NAME = "asther_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const passwordInput = z
  .string()
  .min(1)
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password maksimal 72 byte.",
  );
export const loginSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: passwordInput,
});
export const registerSchema = loginSchema.extend({
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email("Gunakan alamat email yang valid."))
    .transform((value) => value.toLowerCase()),
  password: passwordInput.refine(
    (value) => value.length >= 8,
    "Password minimal 8 karakter.",
  ),
  name: z.string().trim().min(1).max(100).optional(),
});

export function publicUser(user: typeof schema.users.$inferSelect) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
export type SessionUser = ReturnType<typeof publicUser>;

export async function getSession(): Promise<SessionUser | null> {
  const sessionId = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId || !z.uuid().safeParse(sessionId).success) return null;
  const session = await db.query.sessions.findFirst({
    where: eq(schema.sessions.id, sessionId),
  });
  if (!session || session.expiresAt <= new Date()) return null;
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, session.userId),
  });
  return user ? publicUser(user) : null;
}

export async function requireAdmin() {
  const user = await getSession();
  if (!user) throw new HttpError(401, "Silakan masuk terlebih dahulu.");
  if (user.role !== "admin")
    throw new HttpError(403, "Akses ini khusus pengelola.");
  return user;
}

export async function requireAdminPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/chat");
  return user;
}

export async function createSession(userId: string) {
  const store = await cookies();
  const previous = store.get(SESSION_COOKIE_NAME)?.value;
  if (previous && z.uuid().safeParse(previous).success)
    await db.delete(schema.sessions).where(eq(schema.sessions.id, previous));
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.insert(schema.sessions).values({ id, userId, expiresAt });
  store.set(SESSION_COOKIE_NAME, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE_NAME)?.value;
  if (id && z.uuid().safeParse(id).success)
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
  store.delete(SESSION_COOKIE_NAME);
}

export async function loginUser(email: string, password: string) {
  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success)
    return { error: "Username/email atau password tidak valid." };
  await consumeLimit("login-account", parsed.data.email.toLowerCase(), 10, 900);
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, parsed.data.email),
  });
  const valid = await bcrypt.compare(
    password,
    user?.passwordHash ||
      "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
  );
  if (!user || !valid) return { error: "Username/email atau password salah." };
  await createSession(user.id);
  return { user: publicUser(user) };
}

export async function registerUser(
  email: string,
  password: string,
  name?: string,
) {
  const parsed = registerSchema.safeParse({
    email: email.trim(),
    password,
    name,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (
    parsed.data.email ===
    (process.env.DEFAULT_USERNAME || "asther").toLowerCase()
  )
    return { error: "Alamat ini tidak dapat digunakan." };
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [user] = await db
    .insert(schema.users)
    .values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: "user",
    })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();
  if (!user) return { error: "Alamat ini sudah terdaftar. Silakan masuk." };
  await createSession(user.id);
  return { user: publicUser(user) };
}

export async function verifyApiToken(token: string) {
  if (!token || Buffer.byteLength(token) > 72 || token === "changeme")
    return false;
  const config = await getAppConfig();
  if (config?.apiKeyHash) return bcrypt.compare(token, config.apiKeyHash);
  return (
    Boolean(process.env.BEARER_TOKEN) && token === process.env.BEARER_TOKEN
  );
}
