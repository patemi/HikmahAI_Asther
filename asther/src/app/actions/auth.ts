"use server";

import {
  loginUser,
  registerUser,
  deleteSession,
  initializeDefaultUser,
  initializeAppConfig,
} from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  console.log("[ACTION] Login action called");
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log(`[ACTION] Email: ${email}, Password length: ${password?.length || 0}`);

  if (!email || !password) {
    console.log("[ACTION] Missing email or password");
    return { error: "Email and password are required" };
  }

  try {
    await initializeDefaultUser();
    await initializeAppConfig();

    console.log("[ACTION] Calling loginUser...");
    const result = await loginUser(email, password);
    console.log("[ACTION] loginUser result:", result);

    if (result.error) {
      console.log("[ACTION] Login error:", result.error);
      return { error: result.error };
    }
    console.log("[ACTION] Login successful, redirecting...");
  } catch (error) {
    console.error("[ACTION] Login exception:", error);
    return { error: "An error occurred during login. Please try again." };
  }

  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const result = await registerUser(email, password, name || undefined);

  if (result.error) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
