/**
 * Reports API - Dashboard Metrics
 * GET /api/reports/dashboard - Today's key metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Fetch today's dashboard metrics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date range
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const startOfDay = today.toISOString();
    const endOfDay = tomorrow.toISOString();

    // Fetch today's orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    if (ordersError) throw ordersError;

    // Calculate order metrics
    let todayRevenue = 0;
    let totalPaid = 0;
    let paidOrders = 0;

    (orders || []).forEach((order: any) => {
      todayRevenue += order.total_amount;
      totalPaid += order.amount_paid;
      if (order.status === 'paid') paidOrders++;
    });

    // Get active customers
    const { data: customers, error: customersError, count: customerCount } =
      await supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
        .eq('customer_type', 'retail');

    if (customersError) throw customersError;

    // Get active products
    const { data: products, error: productsError, count: productCount } =
      await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

    if (productsError) throw productsError;

    // Get total khata outstanding
    const { data: khataAccounts, error: khataError } = await supabase
      .from('khata_accounts')
      .select('current_balance')
      .eq('is_active', true);

    if (khataError) throw khataError;

    let totalKhataOutstanding = 0;
    (khataAccounts || []).forEach((acc: any) => {
      if (acc.current_balance > 0) {
        totalKhataOutstanding += acc.current_balance;
      }
    });

    const metrics = {
      today_revenue: todayRevenue,
      today_orders: orders?.length || 0,
      today_paid_orders: paidOrders,
      today_total_paid: totalPaid,
      total_khata_outstanding: totalKhataOutstanding,
      active_products: productCount || 0,
      active_customers: customerCount || 0,
      date: today.toISOString().split('T')[0],
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch dashboard metrics',
      },
      { status: 500 }
    );
  }
}
