export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    
    // The id could be khata account id or customer id depending on how frontend calls it.
    // Let's assume it's the khata account id or customer id. We'll check both.
    let account = db.prepare("SELECT * FROM khata_accounts WHERE id = ? AND is_active = 1").get(id) as any;
    if (!account) {
      account = db.prepare("SELECT * FROM khata_accounts WHERE customer_id = ? AND is_active = 1").get(id) as any;
    }

    if (!account) {
      return NextResponse.json({ success: false, error: "Khata account not found" }, { status: 404 });
    }

    const transactions = db.prepare("SELECT * FROM khata_transactions WHERE khata_account_id = ? ORDER BY created_at DESC").all(account.id);
    account.transactions = transactions;

    return NextResponse.json({ success: true, data: account });
  } catch (error: any) {
    console.error("Khata GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch khata account" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const existing = db.prepare("SELECT * FROM khata_accounts WHERE id = ?").get(id) as any;
    if (!existing) {
      return NextResponse.json({ success: false, error: "Khata account not found" }, { status: 404 });
    }

    // Only allow updating opening_balance, and recalculate current_balance
    if (body.opening_balance !== undefined) {
      const newOpening = Number(body.opening_balance);
      const diff = newOpening - existing.opening_balance;
      
      db.prepare(`
        UPDATE khata_accounts 
        SET opening_balance = ?, current_balance = current_balance + ?, updated_at = ? 
        WHERE id = ?
      `).run(newOpening, diff, new Date().toISOString(), id);
    } else if (body.is_active !== undefined) {
      db.prepare("UPDATE khata_accounts SET is_active = ?, updated_at = ? WHERE id = ?").run(
        body.is_active ? 1 : 0, 
        new Date().toISOString(), 
        id
      );
    }

    const updated = db.prepare("SELECT * FROM khata_accounts WHERE id = ?").get(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Khata PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to update khata account" }, { status: 500 });
  }
}
