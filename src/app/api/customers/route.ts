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
    const customers = await pb.collection("customers").getFullList({
      filter: "is_active = true",
      sort: "-created",
    });
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getAdminClient(request);
    const body = await request.json();
    const customer = await pb.collection("customers").create(body);
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create customer" }, { status: 500 });
  }
}