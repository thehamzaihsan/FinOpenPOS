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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureCollections();
    const pb = await getAdminClient();
    const { id } = await params;
    const body = await request.json();
    
    const order = await pb.collection("orders").getOne(id, {
      expand: "order_items_via_order",
    });

    for (const item of order.expand?.order_items_via_order || []) {
      try {
        const product = await pb.collection("products").getOne(item.product);
        await pb.collection("products").update(item.product, {
          stock: (product.stock || 0) + item.quantity,
        });
      } catch (e) {
        console.error("Failed to restore product stock:", e);
      }
    }

    if (order.is_khata && order.customer) {
      try {
        const accounts = await pb.collection("khata_accounts").getFullList({
          filter: `customer = "${order.customer}"`,
        });
        
        if (accounts[0]) {
          await pb.collection("khata_accounts").update(accounts[0].id, {
            balance: Math.max(0, (accounts[0].balance || 0) - order.total_amount),
          });

          await pb.collection("khata_transactions").create({
            account: accounts[0].id,
            amount: order.total_amount,
            type: "credit",
            note: `Refund for order #${order.id}`,
          });
        }
      } catch (e) {
        console.error("Failed to reverse khata:", e);
      }
    }

    await pb.collection("orders").update(id, { status: "refunded" });

    return NextResponse.json({ success: true, message: "Order refunded successfully" });
  } catch (error: any) {
    console.error("Refund error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process refund" }, { status: 500 });
  }
}