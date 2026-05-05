export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/sqlite";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const settings = db.prepare("SELECT * FROM shop_settings WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1").get();
    return NextResponse.json({ success: true, data: settings || null });
  } catch (error: any) {
    console.error("Shop settings GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const id = randomUUID();
    db.prepare(
      `INSERT INTO shop_settings
      (id, shop_name, shop_phone, shop_address, receipt_header, receipt_footer, thermal_printer, tax_number, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(
      id,
      body.shop_name || body.shopName || "",
      body.shop_phone || body.shopPhone || "",
      body.shop_address || body.shopAddress || "",
      body.receipt_header || "",
      body.receipt_footer || "",
      body.thermal_printer || "",
      body.tax_number || "",
      new Date().toISOString()
    );
    const settings = db.prepare("SELECT * FROM shop_settings WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const existing = db.prepare("SELECT * FROM shop_settings WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1").get() as any;
    if (!existing) {
      return NextResponse.json({ success: false, error: "Settings not found" }, { status: 404 });
    }
    db.prepare(
      `UPDATE shop_settings SET
      shop_name = ?, shop_phone = ?, shop_address = ?, receipt_header = ?, receipt_footer = ?, thermal_printer = ?, tax_number = ?
      WHERE id = ?`
    ).run(
      body.shop_name ?? existing.shop_name,
      body.shop_phone ?? existing.shop_phone,
      body.shop_address ?? existing.shop_address,
      body.receipt_header ?? existing.receipt_header,
      body.receipt_footer ?? existing.receipt_footer,
      body.thermal_printer ?? existing.thermal_printer,
      body.tax_number ?? existing.tax_number,
      existing.id
    );
    const settings = db.prepare("SELECT * FROM shop_settings WHERE id = ?").get(existing.id);
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}