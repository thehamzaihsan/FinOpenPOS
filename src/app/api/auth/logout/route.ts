export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/sqlite";

export async function POST(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const session = cookie
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("fin_session="))
    ?.split("=")[1];

  if (session) {
    deleteSession(session);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("fin_session", "", { path: "/", maxAge: 0 });
  return res;
}
