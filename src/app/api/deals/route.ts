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
    const deals = await pb.collection("deals").getFullList({
      filter: "is_active = true",
      sort: "-created",
      expand: "product",
    });
    return NextResponse.json({ success: true, data: deals });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch deals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getAdminClient(request);
    const body = await request.json();
    const deal = await pb.collection("deals").create(body);
    return NextResponse.json({ success: true, data: deal });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create deal" }, { status: 500 });
  }
}