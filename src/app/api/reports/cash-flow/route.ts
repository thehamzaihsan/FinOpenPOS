/**
 * Reports API - Cash Flow Summary
 * GET /api/reports/cash-flow - Daily cash flow breakdown
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Fetch daily cash flow summary
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

    // Fetch orders in date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .order('created_at', { ascending: true });

    if (ordersError) throw ordersError;

    // Fetch expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', dateFrom)
      .lte('expense_date', dateTo);

    if (expensesError && expensesError.code !== 'PGRST116') {
      console.error('Expenses fetch warning:', expensesError);
    }

    // Group by date
    const dailyMap: Record<
      string,
      {
        date: string;
        cash_in: number;
        cash_out: number;
        expenses: number;
        net: number;
        order_count: number;
      }
    > = {};

    // Process orders
    (orders || []).forEach((order: any) => {
      const date = order.created_at.split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          cash_in: 0,
          cash_out: 0,
          expenses: 0,
          net: 0,
          order_count: 0,
        };
      }

      dailyMap[date].order_count++;

      if (order.status === 'paid') {
        dailyMap[date].cash_in += order.amount_paid;
      } else if (order.status === 'partial') {
        dailyMap[date].cash_in += order.amount_paid;
      }

      // Track balance due as cash out (pending/owed)
      if (order.balance_due > 0 && order.payment_method === 'khata') {
        dailyMap[date].cash_out += order.balance_due;
      }
    });

    // Process expenses
    (expenses || []).forEach((expense: any) => {
      const date = expense.expense_date.split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          cash_in: 0,
          cash_out: 0,
          expenses: 0,
          net: 0,
          order_count: 0,
        };
      }

      dailyMap[date].expenses += expense.amount;
    });

    // Calculate net for each day
    Object.values(dailyMap).forEach((day) => {
      day.net = day.cash_in - day.cash_out - day.expenses;
    });

    // Convert to sorted array
    const cashFlow = Object.values(dailyMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Calculate totals
    const totals = {
      total_cash_in: 0,
      total_cash_out: 0,
      total_expenses: 0,
      net_cash: 0,
      day_count: cashFlow.length,
    };

    cashFlow.forEach((day) => {
      totals.total_cash_in += day.cash_in;
      totals.total_cash_out += day.cash_out;
      totals.total_expenses += day.expenses;
      totals.net_cash += day.net;
    });

    return NextResponse.json({
      success: true,
      data: cashFlow,
      totals,
      period: {
        from: dateFrom,
        to: dateTo,
      },
    });
  } catch (error) {
    console.error('Cash flow report error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch cash flow report',
      },
      { status: 500 }
    );
  }
}
