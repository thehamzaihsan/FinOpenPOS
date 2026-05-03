import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb, transaction } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const orders = db.prepare(`
      SELECT o.*, (o.total_amount - o.amount_paid) AS balance_due, c.name AS customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `).all();

    // Map to include expand for UI compatibility
    const expandedOrders = orders.map((o: any) => ({
      ...o,
      expand: {
        customer: {
          name: o.customer_name
        }
      }
    }));

    return NextResponse.json({ success: true, data: expandedOrders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch orders: " + error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { items, customer_id, subtotal, discount_amount, total_amount, amount_paid, payment_method, notes } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: "Order items required" }, { status: 400 });
    }

    if (amount_paid > total_amount) {
      return NextResponse.json({ success: false, error: "amount_paid cannot exceed total_amount" }, { status: 400 });
    }

    let is_khata = 0;
    let status = "paid";
    if (amount_paid < total_amount) {
      if (!customer_id || customer_id === "walkin-default") {
        return NextResponse.json({ success: false, error: "Walk-in customers cannot have unpaid balances" }, { status: 400 });
      }
      is_khata = 1;
      status = "partial";
    }

    const orderId = randomUUID();
    const now = new Date().toISOString();

    transaction(() => {
      db.prepare(
        `INSERT INTO orders (id, customer_id, subtotal, discount_amount, total_amount, amount_paid, payment_method, status, is_khata, notes, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      ).run(
        orderId,
        customer_id || null,
        Number(subtotal || total_amount || 0),
        Number(discount_amount || 0),
        Number(total_amount || 0),
        Number(amount_paid || 0),
        payment_method || "cash",
        status,
        is_khata,
        notes || "",
        now
      );

      for (const item of items) {
        const productId = item.product_id;
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as any;
        if (!product) {
          throw new Error(`Product not found: ${productId}`);
        }

        const qty = item.quantity;
        const updateRes = db.prepare("UPDATE products SET stock = stock - ?, quantity = quantity - ? WHERE id = ? AND stock >= ?").run(qty, qty, product.id, qty);

        if (updateRes.changes === 0) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        const orderItemId = randomUUID();
        const purchasePrice = product.purchase_price || 0;
        const unitPrice = item.unit_price || 0;
        const discountAmt = item.discount_amount || 0;
        const totalPrice = item.total_price || (qty * unitPrice - discountAmt);

        const rawVariantId = item.variant_id;
        let variantId: string | null = null;
        if (rawVariantId) {
          const variant = db.prepare("SELECT id FROM product_variants WHERE id = ?").get(rawVariantId);
          if (variant) {
            variantId = rawVariantId;
          }
        }

        db.prepare(
          `INSERT INTO order_items (id, order_id, product_id, variant_id, product_name, quantity, unit_price, purchase_price, discount_amount, total_price, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(orderItemId, orderId, product.id, variantId, product.name, qty, unitPrice, purchasePrice, discountAmt, totalPrice, now);
      }

      if (is_khata === 1 && customer_id) {
        const diff = Number(total_amount || 0) - Number(amount_paid || 0);

        let khata = db.prepare("SELECT * FROM khata_accounts WHERE customer_id = ?").get(customer_id) as any;
        let khataId = khata?.id;

        if (!khata) {
          khataId = randomUUID();
          db.prepare("INSERT INTO khata_accounts (id, customer_id, opening_balance, current_balance, is_active, created_at) VALUES (?, ?, 0, 0, 1, ?)").run(khataId, customer_id, now);
        }

        db.prepare("UPDATE khata_accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?").run(diff, now, khataId);

        const txId = randomUUID();
        db.prepare("INSERT INTO khata_transactions (id, khata_account_id, order_id, type, amount, notes, created_at) VALUES (?, ?, ?, 'debit', ?, ?, ?)").run(txId, khataId, orderId, diff, "Order partial payment", now);
      }
    });

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as any;
    const itemsResult = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);
    order.items = itemsResult;

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create order" }, { status: 500 });
  }
}
