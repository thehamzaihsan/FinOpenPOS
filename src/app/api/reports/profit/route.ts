/**
 * Reports API - Profit Summary
 * GET /api/reports/profit - Profit by date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Fetch profit summary for date range
 * Query params:
 * - date_from: ISO date string (required)
 * - date_to: ISO date string (required)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'date_from and date_to parameters are required' },
        { status: 400 }
      );
    }

    // Validate dates
    try {
      new Date(dateFrom);
      new Date(dateTo);
    } catch {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Fetch orders in date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    if (ordersError) throw ordersError;

    // Calculate metrics
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalPaid = 0;
    let paidOrders = 0;
    let pendingOrders = 0;

    (orders || []).forEach((order: any) => {
      totalRevenue += order.total_amount;
      totalDiscount += order.discount_total;
      totalPaid += order.amount_paid;

      if (order.status === 'paid') paidOrders++;
      else if (order.status === 'pending' || order.status === 'partial') pendingOrders++;
    });

    // Get total expenses (if expense table exists)
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', dateFrom)
      .lte('expense_date', dateTo);

    if (expensesError && expensesError.code !== 'PGRST116') {
      console.error('Expenses fetch warning:', expensesError);
    }

    let totalExpenses = 0;
    (expenses || []).forEach((exp: any) => {
      totalExpenses += exp.amount;
    });

    // Calculate profit (simplified - actual profit would need cost per item)
    const netProfit = totalPaid - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const summary = {
      date_range: {
        start: dateFrom,
        end: dateTo,
      },
      total_revenue: totalRevenue,
      total_discount: totalDiscount,
      total_expenses: totalExpenses,
      total_paid: totalPaid,
      net_profit: netProfit,
      profit_margin: parseFloat(profitMargin.toFixed(2)),
      order_count: orders?.length || 0,
      paid_orders: paidOrders,
      pending_orders: pendingOrders,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Profit report error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch profit report',
      },
      { status: 500 }
    );
  }
}
