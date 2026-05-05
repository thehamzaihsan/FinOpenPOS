export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDb, transaction } from "@/lib/sqlite";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const deal = db.prepare("SELECT * FROM deals WHERE id = ? AND is_active = 1").get(id) as any;
    if (!deal) throw new Error("not found");

    const items = db.prepare(`
      SELECT di.*, p.name as product_name, p.sale_price, p.price
      FROM deal_items di
      JOIN products p ON di.product_id = p.id
      WHERE di.deal_id = ? AND p.is_active = 1
    `).all(id);
    deal.items = items;

    return NextResponse.json({ success: true, data: deal });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Deal not found" }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const existing = db.prepare("SELECT * FROM deals WHERE id = ?").get(id) as any;
    if (!existing) return NextResponse.json({ success: false, error: "Deal not found" }, { status: 404 });

    transaction(() => {
      db.prepare("UPDATE deals SET name = ?, description = ?, price = ?, is_active = ? WHERE id = ?").run(
        body.name ?? existing.name,
        body.description ?? existing.description,
        body.price !== undefined ? Number(body.price) : existing.price,
        body.is_active === undefined ? existing.is_active : (body.is_active ? 1 : 0),
        id
      );

      if (body.items && Array.isArray(body.items)) {
        db.prepare("DELETE FROM deal_items WHERE deal_id = ?").run(id);
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
    console.error("Deal PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to update deal" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare("UPDATE deals SET is_active = 0 WHERE id = ?").run(id);
    return NextResponse.json({ success: true, message: "Deal deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete deal" }, { status: 500 });
  }
}
