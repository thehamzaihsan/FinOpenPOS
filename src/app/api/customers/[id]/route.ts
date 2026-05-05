import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as any;
    if (!customer) throw new Error("not found");
    
    const khata = db.prepare("SELECT * FROM khata_accounts WHERE customer_id = ?").get(id) as any;
    if (khata) {
      customer.khata_balance = khata.current_balance;
    } else {
      customer.khata_balance = 0;
    }
    
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();
    const existing = db.prepare("SELECT * FROM customers WHERE id = ?").get(id) as any;
    if (!existing) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    db.prepare("UPDATE customers SET name = ?, phone = ?, address = ?, type = ?, is_active = ? WHERE id = ?").run(
      body.name ?? existing.name,
      body.phone ?? existing.phone,
      body.address ?? existing.address,
      body.type ?? existing.type,
      body.is_active === undefined ? existing.is_active : (body.is_active ? 1 : 0),
      id
    );
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare("UPDATE customers SET is_active = 0 WHERE id = ?").run(id);
    return NextResponse.json({ success: true, message: "Customer deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete customer" }, { status: 500 });
  }
}