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

    let revenueParams: string[] = [];
    let revenueDateFilter = "";
    if (from && to) {
      revenueDateFilter = "AND created_at >= ? AND created_at <= ?";
      revenueParams = [from, to];
    }

    const sales = db.prepare(`
      SELECT SUM(total_amount) as revenue 
      FROM orders 
      WHERE is_active = 1 AND status NOT IN ('cancelled', 'refunded')
      ${revenueDateFilter}
    `).get(...revenueParams) as any;

    let cogsParams: string[] = [];
    let cogsDateFilter = "";
    if (from && to) {
      cogsDateFilter = "AND o.created_at >= ? AND o.created_at <= ?";
      cogsParams = [from, to];
    }

    const cogs = db.prepare(`
      SELECT SUM(oi.purchase_price * oi.quantity) as cogs 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.is_active = 1 AND o.status NOT IN ('cancelled', 'refunded')
      ${cogsDateFilter}
    `).get(...cogsParams) as any;

    let expParams: string[] = [];
    let expDateFilter = "";
    if (from && to) {
      expDateFilter = "AND created_at >= ? AND created_at <= ?";
      expParams = [from, to];
    }

    const exp = db.prepare(`
      SELECT SUM(amount) as expenses 
      FROM expenses 
      WHERE 1=1
      ${expDateFilter}
    `).get(...expParams) as any;

    const revenue = sales?.revenue || 0;
    const totalCogs = cogs?.cogs || 0;
    const expenses = exp?.expenses || 0;
    const profit = revenue - totalCogs - expenses;

    return NextResponse.json({ 
      success: true, 
      data: {
        revenue,
        cogs: totalCogs,
        expenses,
        profit
      } 
    });
  } catch (error: any) {
    console.error("Profit report error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch profit data" }, { status: 500 });
  }
}
