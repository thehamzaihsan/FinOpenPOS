import { NextResponse, NextRequest } from "next/server";
import { getDb } from "@/lib/sqlite";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let orderParams: string[] = [];
    let orderDateFilter = "";
    if (from && to) {
      orderDateFilter = "AND created_at >= ? AND created_at <= ?";
      orderParams = [from, to];
    }

    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE is_active = 1
      ${orderDateFilter}
      ORDER BY created_at DESC
    `).all(...orderParams);

    let topParams: string[] = [];
    let topDateFilter = "";
    if (from && to) {
      topDateFilter = "AND o.created_at >= ? AND o.created_at <= ?";
      topParams = [from, to];
    }

    const topProducts = db.prepare(`
      SELECT oi.product_id, p.name, SUM(oi.quantity) as qty_sold, SUM(oi.total_price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.is_active = 1 AND o.status NOT IN ('cancelled', 'refunded')
      ${topDateFilter}
      GROUP BY oi.product_id, p.name
      ORDER BY qty_sold DESC
      LIMIT 10
    `).all(...topParams);

    return NextResponse.json({ 
      success: true, 
      data: {
        orders,
        topProducts
      } 
    });
  } catch (error: any) {
    console.error("Sales report error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch sales data" }, { status: 500 });
  }
}
