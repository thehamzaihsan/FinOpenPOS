export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let expParams: string[] = [];
    let totalParams: string[] = [];
    let expDateFilter = "";
    let totalDateFilter = "";
    if (from && to) {
      expDateFilter = "AND created_at >= ? AND created_at <= ?";
      totalDateFilter = "AND created_at >= ? AND created_at <= ?";
      expParams = [from, to];
      totalParams = [from, to];
    }

    const expenses = db.prepare(`
      SELECT * FROM expenses 
      WHERE 1=1
      ${expDateFilter}
      ORDER BY created_at DESC
    `).all(...expParams);

    const total = db.prepare(`
      SELECT SUM(amount) as total 
      FROM expenses 
      WHERE 1=1
      ${totalDateFilter}
    `).get(...totalParams) as any;

    return NextResponse.json({ 
      success: true, 
      data: {
        expenses,
        total: total?.total || 0
      } 
    });
  } catch (error: any) {
    console.error("Expenses report error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch expenses data" }, { status: 500 });
  }
}
