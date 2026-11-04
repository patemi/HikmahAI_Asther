"use server";
import { loginUser, registerUser, deleteSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { consumeLimit, requestIdentity } from "@/lib/limits";
import { HttpError } from "@/lib/http";

async function throttle() {
  await consumeLimit(
    "auth-network",
    requestIdentity(
      new Request("http://localhost", { headers: await headers() }),
    ),
    20,
    900,
  );
}
export async function login(formData: FormData) {
  try {
    await throttle();
    const result = await loginUser(
      String(formData.get("email") || "").trim(),
      String(formData.get("password") || ""),
    );
    if (result.error) return { error: result.error };
    if (result.user?.role !== "admin")
      return {
        error: "Akun ini tidak memiliki akses pengelola. Gunakan halaman Chat.",
      };
  } catch (error) {
    return {
      error:
        error instanceof HttpError
          ? error.message
          : "Layanan masuk belum tersedia. Silakan coba kembali.",
    };
  }
  redirect("/dashboard");
}
export async function register(formData: FormData) {
  try {
    await throttle();
    const result = await registerUser(
      String(formData.get("email") || ""),
      String(formData.get("password") || ""),
      String(formData.get("name") || "").trim() || undefined,
    );
    if (result.error) return { error: result.error };
  } catch (error) {
    return {
      error:
        error instanceof HttpError
          ? error.message
          : "Pendaftaran belum tersedia.",
    };
  }
  redirect("/chat");
}
export async function logout() {
  await deleteSession();
  redirect("/login");
}
