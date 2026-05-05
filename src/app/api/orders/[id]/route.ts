export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const order = db.prepare(`
      SELECT o.*, (o.total_amount - o.amount_paid) AS balance_due, c.name AS customer_name, c.phone AS customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(id) as any;

    if (!order) throw new Error("not found");
    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);

    // Structure for UI compatibility
    const data = {
      ...order,
      items,
      customers: order.customer_name ? {
        id: order.customer_id,
        name: order.customer_name,
        phone: order.customer_phone
      } : null
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const action = body.action;

    if (action === "refund") {
      const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as any[];
      for (const item of items) {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.product_id) as any;
        if (product) {
          db.prepare("UPDATE products SET quantity = quantity + ?, stock = stock + ? WHERE id = ?").run(
            item.quantity || 0,
            item.quantity || 0,
            item.product_id
          );
        }
      }
      db.prepare("UPDATE orders SET status = 'refunded' WHERE id = ?").run(id);
      return NextResponse.json({ success: true, message: "Order refunded" });
    }

    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any;
    if (!existing) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    db.prepare("UPDATE orders SET customer_id = ?, total_amount = ?, payment_method = ?, status = ?, is_khata = ?, is_active = ? WHERE id = ?").run(
      body.customer_id ?? existing.customer_id,
      Number(body.total_amount ?? existing.total_amount ?? 0),
      body.payment_method ?? existing.payment_method,
      body.status ?? existing.status,
      body.is_khata === undefined ? existing.is_khata : (body.is_khata ? 1 : 0),
      body.is_active === undefined ? existing.is_active : (body.is_active ? 1 : 0),
      id
    );
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare("DELETE FROM order_items WHERE order_id = ?").run(id);
    db.prepare("DELETE FROM orders WHERE id = ?").run(id);
    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete order" }, { status: 500 });
  }
}
