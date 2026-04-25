import { NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { ensureCollections } from "@/lib/ensure-collections";

export const dynamic = "force-dynamic";

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = "admin@possys.com";
const ADMIN_PASSWORD = "PosSys@123456";

async function getAdminClient() {
  const pb = new PocketBase(PB_URL);
  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
  } catch {
    const res = await pb.send("/api/admins/auth-with-password", {
      method: "POST",
      body: { identity: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    pb.authStore.save(res.token, res.admin);
  }
  return pb;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pb = await getAdminClient();
    const account = await pb.collection("khata_accounts").getOne(id, {
      expand: "customer,khata_transactions_via_khata_account",
    });
    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Khata account not found" }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pb = await getAdminClient();
    const body = await request.json();
    const account = await pb.collection("khata_accounts").update(id, body);
    return NextResponse.json({ success: true, data: account });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update khata account" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pb = await getAdminClient();
    await pb.collection("khata_accounts").delete(id);
    return NextResponse.json({ success: true, message: "Khata account deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete khata account" }, { status: 500 });
  }
}