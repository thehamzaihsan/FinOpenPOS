import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

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

export async function POST(request: Request) {
  try {
    const pb = await getAdminClient();
    const body = await request.json();
    const importData = body.data || [];
    const results = [];
    
    for (const item of importData) {
      try {
        const product = await pb.collection("products").create(item);
        results.push({ success: true, id: product.id, name: product.name });
      } catch (e: any) {
        results.push({ success: false, name: item.name, error: e.message });
      }
    }
    
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to import products" }, { status: 500 });
  }
}