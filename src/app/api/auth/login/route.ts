export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { loginUser, upsertUser } from "@/lib/sqlite";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const profileId = String(body.profileId || "");

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    // First login for an existing profile auto-provisions SQLite auth.
    upsertUser(profileId, email, password);
    const result = loginUser(email, password);
    if (!result) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const res = NextResponse.json({ success: true, data: result.user, sessionId: result.sessionId });
    res.cookies.set("pos_session", result.sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Login failed" }, { status: 500 });
  }
}
