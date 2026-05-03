import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";

    let query = `
      SELECT k.*, c.name as customer_name, c.phone as customer_phone
      FROM khata_accounts k
      JOIN customers c ON k.customer_id = c.id
      WHERE k.is_active = 1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND c.name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY k.created_at DESC`;

    const accounts = db.prepare(query).all(...params);
    return NextResponse.json({ success: true, data: accounts });
  } catch (error: any) {
    console.error("Khata accounts GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch khata accounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    if (!body.customer_id) {
      return NextResponse.json({ success: false, error: "Customer ID is required" }, { status: 400 });
    }

    // Check if customer exists and is retail
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(body.customer_id) as any;
    if (!customer) {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }
    if (customer.type === 'walkin' || customer.id === 'walkin-default') {
      return NextResponse.json({ success: false, error: "Walk-in customers cannot have khata accounts" }, { status: 400 });
    }

    // Check no duplicate
    const existing = db.prepare("SELECT * FROM khata_accounts WHERE customer_id = ? AND is_active = 1").get(body.customer_id);
    if (existing) {
      return NextResponse.json({ success: false, error: "Khata account already exists for this customer" }, { status: 400 });
    }
    
    const id = randomUUID();
    const openingBalance = Number(body.opening_balance || 0);

    db.prepare(
      "INSERT INTO khata_accounts (id, customer_id, opening_balance, current_balance, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)"
    ).run(id, body.customer_id, openingBalance, openingBalance, new Date().toISOString(), new Date().toISOString());
    
    const account = db.prepare("SELECT * FROM khata_accounts WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: account });
  } catch (error: any) {
    console.error("Khata accounts POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create khata account" }, { status: 500 });
  }
}
