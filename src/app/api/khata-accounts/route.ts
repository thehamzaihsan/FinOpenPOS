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
    const accounts = await pb.collection("khata_accounts").getFullList({
      expand: "customer",
    });
    return NextResponse.json({ success: true, data: accounts });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch khata accounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const pb = await getAdminClient(request);
    const body = await request.json();
    
    if (!body.customer) {
      return NextResponse.json({ success: false, error: "Customer is required" }, { status: 400 });
    }
    
    const account = await pb.collection("khata_accounts").create({
      customer: body.customer,
      balance: body.balance || 0,
    });
    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create khata account" }, { status: 500 });
  }
}