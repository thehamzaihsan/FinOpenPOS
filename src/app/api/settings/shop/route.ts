import { NextResponse, NextRequest } from "next/server";
import PocketBase from "pocketbase";

async function getAdminClient(request: NextRequest) {
  const email = request.headers.get("x-pb-email") || "";
  const password = request.headers.get("x-pb-password") || "";
  const client = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090");
  await client.admins.authWithPassword(email, password);
  return client;
}

export async function GET(request: NextRequest) {
  try {
    const pb = await getAdminClient(request);
    const settings = await pb.collection("shop_settings").getFirstListItem("is_active = true");
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: "Settings not found" }, { status: 404 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getAdminClient(request);
    const body = await request.json();
    const settings = await pb.collection("shop_settings").create(body);
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const pb = await getAdminClient(request);
    const body = await request.json();
    const existing = await pb.collection("shop_settings").getFirstListItem("is_active = true");
    const settings = await pb.collection("shop_settings").update(existing.id, body);
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}