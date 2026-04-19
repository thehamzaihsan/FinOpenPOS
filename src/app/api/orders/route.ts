/**
 * Orders API - List & Create
 * GET: List orders with filtering
 * POST: Create new order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const supabase = await createClient();

    let query = supabase
      .from('orders')
      .select('*,customer:customers(*),items:order_items(*)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Orders list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_id,
      subtotal,
      discount_total,
      total_amount,
      amount_paid,
      payment_method,
      status,
      is_khata,
      notes,
      items,
    } = body;

    // Validate required fields
    if (total_amount === undefined || amount_paid === undefined) {
      return NextResponse.json(
        { error: 'total_amount and amount_paid are required' },
        { status: 400 }
      );
    }

    if (typeof total_amount !== 'number' || typeof amount_paid !== 'number') {
      return NextResponse.json(
        { error: 'Price fields must be numbers' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify auth since RLS requires it
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine order status
    let orderStatus = status || (amount_paid >= total_amount ? 'paid' : 'partial');
    
    // Ensure status is valid
    if (!['pending', 'paid', 'partial', 'refunded'].includes(orderStatus)) {
      orderStatus = amount_paid >= total_amount ? 'paid' : 'partial';
    }

    // Calculate balance
    const balance = total_amount - amount_paid;

    // Create order (customer_id can be null for walk-in)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          customer_id: customer_id || null,  // NULL for walk-in
          subtotal: subtotal || 0,
          discount_total: discount_total || 0,
          total_amount,
          amount_paid,
          payment_method: payment_method || 'cash',
          status: orderStatus,
          is_khata: balance > 0 && customer_id ? true : false,  // Only khata if customer exists
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // If items are provided, insert them directly!
    if (items && Array.isArray(items) && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        user_id: user.id,
        order_id: order.id,
        product_id: item.product_id || null,
        product_variant_id: item.product_variant_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct || 0,
        discount_amount: item.discount_amount || 0,
        line_total: item.line_total || 0,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        // It's a partial failure, but we return the error
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: order,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
