import { NextResponse, NextRequest } from "next/server";
import PocketBase from "pocketbase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090");
    
    pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

    if (pb.authStore.isValid) {
        try {
            await pb.collection('admins').authRefresh();
        } catch (_) {
            pb.authStore.clear();
        }
    }

    if (!pb.authStore.isValid) {
        return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const user = pb.authStore.model;
    return NextResponse.json({ success: true, data: user });

  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}
