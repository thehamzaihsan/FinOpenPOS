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

export async function GET() {
  try {
    await ensureCollections();
    const pb = await getAdminClient();
    const variants = await pb.collection("product_variants").getFullList();
    return NextResponse.json({ success: true, data: variants });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch variants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureCollections();
    const pb = await getAdminClient();
    const body = await request.json();
    const variant = await pb.collection("product_variants").create(body);
    return NextResponse.json({ success: true, data: variant });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create variant" }, { status: 500 });
  }
}