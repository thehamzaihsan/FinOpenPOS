export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const variants = db.prepare("SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY created_at DESC").all(id);
    return NextResponse.json({ success: true, data: variants });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch variants" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;
    const db = getDb();
    const body = await request.json();
    const id = randomUUID();
    
    // Check if parent product exists
    const product = db.prepare("SELECT id FROM products WHERE id = ? AND is_active = 1").get(productId);
    if (!product) {
      return NextResponse.json({ success: false, error: "Parent product not found" }, { status: 404 });
    }

    db.prepare(`
      INSERT INTO product_variants
      (id, product_id, name, item_code, purchase_price, sale_price, stock, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      productId,
      body.name || body.variant_name || "",
      body.item_code || "",
      Number(body.purchase_price || 0),
      Number(body.sale_price || 0),
      Number(body.stock || body.quantity || 0),
      new Date().toISOString()
    );
    const variant = db.prepare("SELECT * FROM product_variants WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: variant });
  } catch (error: any) {
    console.error("Failed to create variant:", error);
    return NextResponse.json({ success: false, error: "Failed to create variant" }, { status: 500 });
  }
}
