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

    const result: any = {};

    let dateFilter = "";
    let dateParams: string[] = [];
    if (from && to) {
      dateFilter = "AND created_at >= ? AND created_at <= ?";
      dateParams = [from, to];
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();
      dateFilter = "AND created_at >= ?";
      dateParams = [todayIso];
    }

    result.ordersCount = 0;
    result.totalRevenue = 0;
    result.ordersToday = 0;
    result.todaysSales = 0;

    const stats = db.prepare(`
      SELECT COUNT(id) as orders_count, SUM(total_amount) as total_revenue 
      FROM orders 
      WHERE is_active = 1 AND status NOT IN ('cancelled', 'refunded')
      ${dateFilter}
    `).get(...dateParams) as any;

    result.ordersCount = stats?.orders_count || 0;
    result.totalRevenue = stats?.total_revenue || 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const todayStats = db.prepare(`
      SELECT COUNT(id) as orders_today, SUM(total_amount) as todays_sales 
      FROM orders 
      WHERE created_at >= ? AND is_active = 1 AND status NOT IN ('cancelled', 'refunded')
    `).get(todayIso) as any;
    
    result.ordersToday = todayStats?.orders_today || 0;
    result.todaysSales = todayStats?.todays_sales || 0;

    const khataStats = db.prepare(`
      SELECT COUNT(id) as customers_with_khata, SUM(current_balance) as outstanding_khata 
      FROM khata_accounts 
      WHERE current_balance > 0 AND is_active = 1
    `).get() as any;

    result.customersWithKhata = khataStats?.customers_with_khata || 0;
    result.outstandingKhata = khataStats?.outstanding_khata || 0;

    const lowStock = db.prepare(`
      SELECT * FROM products 
      WHERE (quantity <= min_stock OR stock <= min_stock) AND is_active = 1 
      ORDER BY quantity ASC 
      LIMIT 10
    `).all();
    
    result.lowStock = lowStock;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.toISOString();
      
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const end = nextD.toISOString();

      const dayStats = db.prepare(`
        SELECT SUM(total_amount) as sales 
        FROM orders 
        WHERE created_at >= ? AND created_at < ? AND is_active = 1 AND status NOT IN ('cancelled', 'refunded')
      `).get(start, end) as any;

      last7Days.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sales: dayStats?.sales || 0,
      });
    }
    result.last7Days = last7Days;

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Dashboard report error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
