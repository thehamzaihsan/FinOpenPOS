import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    const khataAccounts = db.prepare(`
      SELECT k.*, c.name as customer_name, c.phone as customer_phone
      FROM khata_accounts k
      JOIN customers c ON k.customer_id = c.id
      WHERE k.is_active = 1
      ORDER BY k.current_balance DESC
    `).all();

    return NextResponse.json({ success: true, data: khataAccounts });
  } catch (error: any) {
    console.error("Khata report error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch khata data" }, { status: 500 });
  }
}
