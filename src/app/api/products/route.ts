import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/sqlite";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const products = db.prepare("SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC").all() as any[];
    
    // Fetch all active variants
    const variants = db.prepare("SELECT * FROM product_variants WHERE is_active = 1").all() as any[];

    // Group variants by product_id
    const variantsByProduct = variants.reduce((acc, variant) => {
      if (!acc[variant.product_id]) acc[variant.product_id] = [];
      acc[variant.product_id].push(variant);
      return acc;
    }, {} as Record<string, any[]>);

    // Attach variants to products
    for (const p of products) {
      p.variants = variantsByProduct[p.id] || [];
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error("Products GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ success: false, error: "Product name is required" }, { status: 400 });
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO products 
      (id, name, description, item_code, sku, purchase_price, sale_price, price, stock, quantity, min_stock, min_discount, max_discount, unit, category, is_active, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(
      id,
      body.name,
      body.description || "",
      body.item_code || "",
      body.sku || "",
      Number(body.purchase_price || 0),
      Number(body.sale_price || 0),
      Number(body.sale_price || 0), // price (legacy)
      Number(body.quantity || 0),   // stock (legacy)
      Number(body.quantity || 0),
      Number(body.min_stock || 5),
      Number(body.min_discount || 0),
      Number(body.max_discount || 0),
      body.unit || "piece",
      body.category || "",
      new Date().toISOString()
    );
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error("Products POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}