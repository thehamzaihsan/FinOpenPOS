export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb, transaction } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const deals = db.prepare("SELECT * FROM deals WHERE is_active = 1 ORDER BY created_at DESC").all() as any[];

    const items = db.prepare(`
      SELECT di.*, p.name as product_name, p.sale_price, p.price
      FROM deal_items di
      JOIN products p ON di.product_id = p.id
      WHERE p.is_active = 1
    `).all() as any[];

    for (const deal of deals) {
      deal.items = items.filter(item => item.deal_id === deal.id);
    }

    return NextResponse.json({ success: true, data: deals });
  } catch (error: any) {
    console.error("Deals GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch deals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    if (!body.name || !body.price) {
      return NextResponse.json({ success: false, error: "Name and price are required" }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    transaction(() => {
      db.prepare(
        "INSERT INTO deals (id, name, description, price, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)"
      ).run(id, body.name, body.description || "", Number(body.price), now);

      if (body.items && Array.isArray(body.items)) {
        for (const item of body.items) {
          const itemId = randomUUID();
          db.prepare(
            "INSERT INTO deal_items (id, deal_id, product_id, quantity) VALUES (?, ?, ?, ?)"
          ).run(itemId, id, item.product_id, Number(item.quantity || 1));
        }
      }
    });

    const deal = db.prepare("SELECT * FROM deals WHERE id = ?").get(id) as any;
    deal.items = db.prepare("SELECT * FROM deal_items WHERE deal_id = ?").all(id);

    return NextResponse.json({ success: true, data: deal });
  } catch (error: any) {
    console.error("Deals POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create deal" }, { status: 500 });
  }
}
