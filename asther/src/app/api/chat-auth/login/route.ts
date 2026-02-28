import { NextRequest, NextResponse } from "next/server";
import { initializeAppConfig, initializeDefaultUser, loginUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    await initializeDefaultUser();
    await initializeAppConfig();

    const result = await loginUser(email, password);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("Chat auth login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
