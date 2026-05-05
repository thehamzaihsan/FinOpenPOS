export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!product) throw new Error("not found");
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as any;
    if (!existing) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    
    db.prepare(`
      UPDATE products SET 
        name = ?, 
        description = ?,
        item_code = ?,
        sku = ?, 
        purchase_price = ?,
        sale_price = ?,
        price = ?,
        stock = ?,
        quantity = ?,
        min_stock = ?,
        min_discount = ?,
        max_discount = ?,
        unit = ?,
        category = ?, 
        is_active = ? 
      WHERE id = ?
    `).run(
      body.name ?? existing.name,
      body.description ?? existing.description,
      body.item_code ?? existing.item_code,
      body.sku ?? existing.sku,
      Number(body.purchase_price ?? existing.purchase_price ?? 0),
      Number(body.sale_price ?? existing.sale_price ?? 0),
      Number(body.sale_price ?? existing.sale_price ?? existing.price ?? 0), // price (legacy)
      Number(body.quantity ?? existing.quantity ?? existing.stock ?? 0),   // stock (legacy)
      Number(body.quantity ?? existing.quantity ?? 0),
      Number(body.min_stock ?? existing.min_stock ?? 5),
      Number(body.min_discount ?? existing.min_discount ?? 0),
      Number(body.max_discount ?? existing.max_discount ?? 0),
      body.unit ?? existing.unit,
      body.category ?? existing.category,
      body.is_active === undefined ? existing.is_active : (body.is_active ? 1 : 0),
      id
    );

    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Product PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to update product: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare("UPDATE products SET is_active = 0 WHERE id = ?").run(id);
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}
