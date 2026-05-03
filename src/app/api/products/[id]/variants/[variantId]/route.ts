import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string, variantId: string }> }) {
  try {
    const { id: productId, variantId } = await params;
    const db = getDb();
    const body = await request.json();
    const existing = db.prepare("SELECT * FROM product_variants WHERE id = ? AND product_id = ?").get(variantId, productId) as any;
    if (!existing) return NextResponse.json({ success: false, error: "Variant not found" }, { status: 404 });
    
    db.prepare(`
      UPDATE product_variants SET 
        name = ?, 
        item_code = ?,
        purchase_price = ?,
        sale_price = ?,
        stock = ?,
        is_active = ? 
      WHERE id = ?
    `).run(
      body.name ?? body.variant_name ?? existing.name,
      body.item_code ?? existing.item_code,
      Number(body.purchase_price ?? existing.purchase_price ?? 0),
      Number(body.sale_price ?? existing.sale_price ?? 0),
      Number(body.stock ?? body.quantity ?? existing.stock ?? 0),
      body.is_active === undefined ? existing.is_active : (body.is_active ? 1 : 0),
      variantId
    );

    const variant = db.prepare("SELECT * FROM product_variants WHERE id = ?").get(variantId);
    return NextResponse.json({ success: true, data: variant });
  } catch (error: any) {
    console.error("Variant PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to update variant" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, variantId: string }> }) {
  try {
    const { variantId } = await params;
    const db = getDb();
    db.prepare("UPDATE product_variants SET is_active = 0 WHERE id = ?").run(variantId);
    return NextResponse.json({ success: true, message: "Variant deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete variant" }, { status: 500 });
  }
}
