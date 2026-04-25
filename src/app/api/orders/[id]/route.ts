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
    const order = await pb.collection("orders").getOne(id, {
      expand: "customer,order_items_via_order.product",
    });
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pb = await getAdminClient();
    const body = await request.json();
    const action = body.action;

    if (action === "refund") {
      const order = await pb.collection("orders").getOne(id, {
        expand: "order_items_via_order",
      });

      for (const item of order.expand?.order_items_via_order || []) {
        const product = await pb.collection("products").getOne(item.product);
        await pb.collection("products").update(item.product, {
          stock: (product.stock || 0) + item.quantity,
        });
      }

      await pb.collection("orders").update(id, { status: "refunded" });
      return NextResponse.json({ success: true, message: "Order refunded" });
    }

    const order = await pb.collection("orders").update(id, body);
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pb = await getAdminClient();
    await pb.collection("orders").delete(id);
    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete order" }, { status: 500 });
  }
}