/**
 * Reports API - Top Products
 * GET /api/reports/top-products - Best-selling products
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Fetch top-selling products
 * Query params:
 * - limit: number (default: 10, max: 100)
 * - date_from: ISO date string (optional)
 * - date_to: ISO date string (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    if (limit < 1) {
      return NextResponse.json(
        { error: 'Limit must be at least 1' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('order_items')
      .select(
        `
        quantity,
        unit_price,
        line_total,
        product:product_id(id, name, item_code),
        order:order_id(created_at)
        `
      );

    if (dateFrom) {
      query = query.gte('order.created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('order.created_at', dateTo);
    }

    const { data: items, error } = await query;

    if (error) throw error;

    // Group by product and calculate stats
    const productMap: Record<
      string,
      {
        product_id: string;
        product_name: string;
        item_code: string | null;
        units_sold: number;
        revenue: number;
        profit?: number;
      }
    > = {};

    (items || []).forEach((item: any) => {
      if (!item.product?.id) return;

      const productId = item.product.id;
      if (!productMap[productId]) {
        productMap[productId] = {
          product_id: productId,
          product_name: item.product.name,
          item_code: item.product.item_code,
          units_sold: 0,
          revenue: 0,
        };
      }

      productMap[productId].units_sold += item.quantity;
      productMap[productId].revenue += item.line_total;
    });

    // Convert to array and sort by revenue
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map((product, index) => ({
        ...product,
        rank: index + 1,
      }));

    return NextResponse.json({
      success: true,
      data: topProducts,
      count: topProducts.length,
      period: {
        from: dateFrom || 'all',
        to: dateTo || 'now',
      },
    });
  } catch (error) {
    console.error('Top products report error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch top products',
      },
      { status: 500 }
    );
  }
}
