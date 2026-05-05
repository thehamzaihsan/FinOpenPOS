import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb, transaction } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb();
    const { id } = await params;

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as any;
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.status === "refunded") {
      return NextResponse.json({ success: false, error: "Order already refunded" }, { status: 400 });
    }

    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as any[];
    const now = new Date().toISOString();

    transaction(() => {
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

      if (order.is_khata === 1 && order.customer_id) {
        const khata = db.prepare("SELECT * FROM khata_accounts WHERE customer_id = ?").get(order.customer_id) as any;
        if (khata) {
          const unpaidAmount = order.total_amount - order.amount_paid;
          db.prepare("UPDATE khata_accounts SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?").run(unpaidAmount, now, khata.id);

          const txId = randomUUID();
          db.prepare("INSERT INTO khata_transactions (id, khata_account_id, order_id, type, amount, notes, created_at) VALUES (?, ?, ?, 'credit', ?, ?, ?)").run(txId, khata.id, order.id, unpaidAmount, "Order refund", now);
        }
      }

      db.prepare("UPDATE orders SET status = 'refunded' WHERE id = ?").run(id);
    });

    return NextResponse.json({ success: true, message: "Order refunded successfully" });
  } catch (error: any) {
    console.error("Refund error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process refund" }, { status: 500 });
  }
}
