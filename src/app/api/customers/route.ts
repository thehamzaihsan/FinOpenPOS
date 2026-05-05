import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    // Return retail customers only by default, or all active
    // Join with khata_accounts to get current_balance
    const customers = db.prepare(`
      SELECT c.*, ka.current_balance 
      FROM customers c
      LEFT JOIN khata_accounts ka ON c.id = ka.customer_id
      WHERE c.is_active = 1 AND c.type = 'retail' 
      ORDER BY c.created_at DESC
    `).all();
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Customer name is required" }, { status: 400 });
    }

    const id = randomUUID();
    db.prepare(
      "INSERT INTO customers (id, name, phone, address, type, is_active, created_at) VALUES (?, ?, ?, ?, 'retail', 1, ?)"
    ).run(
      id, 
      body.name, 
      body.phone || "", 
      body.address || "", 
      new Date().toISOString()
    );
    
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to create customer: " + error.message }, { status: 500 });
  }
}
