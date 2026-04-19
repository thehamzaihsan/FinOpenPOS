/**
 * Orders API - Today's Orders
 * GET /api/orders/today
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Fetch today's orders
 * Query params:
 * - status: pending|paid|partial|refunded (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get today's date range in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const startOfDay = today.toISOString();
    const endOfDay = tomorrow.toISOString();

    let query = supabase
      .from('orders')
      .select(
        `
        *,
        customer:customer_id(*),
        items:order_items(
          *,
          product:product_id(*),
          variant:product_variant_id(*)
        )
        `,
        { count: 'exact' }
      )
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    if (status) {
      const validStatuses = ['pending', 'paid', 'partial', 'refunded'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) throw error;

    // Calculate daily totals
    const totals = {
      total_revenue: 0,
      total_discount: 0,
      total_paid: 0,
      order_count: count || 0,
      paid_orders: 0,
      pending_orders: 0,
      partial_orders: 0,
    };

    (data || []).forEach((order: any) => {
      totals.total_revenue += order.total_amount;
      totals.total_discount += order.discount_total;
      totals.total_paid += order.amount_paid;

      if (order.status === 'paid') totals.paid_orders++;
      else if (order.status === 'pending') totals.pending_orders++;
      else if (order.status === 'partial') totals.partial_orders++;
    });

    return NextResponse.json({
      success: true,
      data: data || [],
      totals,
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Today orders fetch error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch today orders',
      },
      { status: 500 }
    );
  }
}
