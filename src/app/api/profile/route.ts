import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Try Authorization header first
    const authHeader = request.headers.get("authorization") || "";
    let sessionId = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";

    // Fallback to cookies
    if (!sessionId) {
      const cookie = request.headers.get("cookie") || "";
      sessionId = cookie
        .split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith("pos_session=") || x.startsWith("fin_session="))
        ?.split("=")[1] || "";
    }

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ success: true, data: session.user });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}
