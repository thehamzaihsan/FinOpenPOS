import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb, transaction } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const account = db.prepare("SELECT * FROM khata_accounts WHERE id = ? AND is_active = 1").get(id) as any;
    if (!account) {
      return NextResponse.json({ success: false, error: "Khata account not found" }, { status: 404 });
    }

    const transactions = db.prepare(`
      SELECT kt.*, o.id AS order_id, o.status AS order_status
      FROM khata_transactions kt
      LEFT JOIN orders o ON kt.order_id = o.id
      WHERE kt.khata_account_id = ?
      ORDER BY kt.created_at DESC
    `).all(id);

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    console.error("Khata transactions fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch khata transactions" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const account = db.prepare("SELECT * FROM khata_accounts WHERE id = ? AND is_active = 1").get(id) as any;
    if (!account) {
      return NextResponse.json({ success: false, error: "Khata account not found" }, { status: 404 });
    }

    const amount = Number(body.amount || 0);
    if (amount <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be greater than zero" }, { status: 400 });
    }

    const type = body.type;
    if (type !== 'credit' && type !== 'debit') {
      return NextResponse.json({ success: false, error: "Type must be 'credit' or 'debit'" }, { status: 400 });
    }

    const notes = body.notes || "";
    const now = new Date().toISOString();
    const txId = randomUUID();

    transaction(() => {
      const diff = type === 'debit' ? amount : -amount;

      db.prepare(`
        UPDATE khata_accounts
        SET current_balance = current_balance + ?, updated_at = ?
        WHERE id = ?
      `).run(diff, now, id);

      db.prepare(`
        INSERT INTO khata_transactions (id, khata_account_id, order_id, type, amount, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(txId, id, null, type, amount, notes, now);
    });

    const result = db.prepare("SELECT * FROM khata_transactions WHERE id = ?").get(txId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Khata transaction error:", error);
    return NextResponse.json({ success: false, error: "Failed to add khata transaction" }, { status: 500 });
  }
}
