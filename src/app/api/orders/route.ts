/**
 * Orders API - List & Create
 * GET: List orders with filtering
 * POST: Create new order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
      items,
      amount_paid,
      payment_method,
      notes,
    } = body;

    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer and items are required' },
        { status: 400 }
      );
    }

    if (amount_paid === undefined || amount_paid < 0) {
      return NextResponse.json(
        { error: 'Valid amount_paid required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate totals
    let subtotal = 0;
    let discountTotal = 0;

    for (const item of items) {
      const lineSubtotal = item.quantity * item.unit_price;
      const discount = (lineSubtotal * (item.discount_pct || 0)) / 100;
      subtotal += lineSubtotal;
      discountTotal += discount;
    }

    const totalAmount = subtotal - discountTotal;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_id,
          subtotal,
          discount_total: discountTotal,
          total_amount: totalAmount,
          amount_paid: Math.min(amount_paid, totalAmount),
          balance_due: Math.max(0, totalAmount - amount_paid),
          payment_method: payment_method || 'cash',
          notes: notes || null,
          status: amount_paid >= totalAmount ? 'paid' : 'partial',
        },
      ])
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Add order items
    const orderItems = items.map((item: any) => {
      const lineSubtotal = item.quantity * item.unit_price;
      const discountAmount = (lineSubtotal * (item.discount_pct || 0)) / 100;
      return {
        order_id: order.id,
        product_id: item.product_id,
        product_variant_id: item.product_variant_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct || 0,
        discount_amount: discountAmount,
        line_total: lineSubtotal - discountAmount,
      };
    });

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // If underpaid, create khata transaction
    if (amount_paid < totalAmount) {
      // Check if customer has khata account
      const { data: khataAccount } = await supabase
        .from('khata_accounts')
        .select('id,current_balance')
        .eq('customer_id', customer_id)
        .single();

      if (khataAccount) {
        const balanceDue = totalAmount - amount_paid;
        const currentBalance = khataAccount.current_balance || 0;
        await supabase.from('khata_transactions').insert([
          {
            khata_account_id: khataAccount.id,
            order_id: order.id,
            amount: balanceDue,
            transaction_type: 'debit',
            description: `Order #${order.id} - Balance due`,
            balance_after: currentBalance + balanceDue,
          },
        ]);

        // Update khata balance
        await supabase
          .from('khata_accounts')
          .update({
            current_balance: currentBalance + balanceDue,
          })
          .eq('id', khataAccount.id);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          order,
          items: createdItems,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
