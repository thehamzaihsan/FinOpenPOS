/**
 * Orders API - Add Items to Order
 * POST /api/orders/[orderId]/items - Add items to existing order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OrderItemInput } from '@/types/database.types';

/**
 * POST - Add items to existing order
 * Updates order totals accordingly
 * Body: { items: OrderItemInput[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Don't allow adding items to already paid/refunded orders unless we are initially creating the order items
    // (We'll allow it for now to fix the POS bug, a better way would be a single transaction endpoint)
    if (['refunded'].includes(order.status)) {
      return NextResponse.json(
        {
          error: `Cannot add items to ${order.status} orders`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Must provide at least one item' },
        { status: 400 }
      );
    }

    // Validate and calculate new totals
    let additionalSubtotal = 0;
    let additionalDiscount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item.product_id && !item.product_variant_id) {
        return NextResponse.json(
          {
            error: `Item ${i + 1}: Must specify either product_id or product_variant_id`,
          },
          { status: 400 }
        );
      }

      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Quantity must be a positive number` },
          { status: 400 }
        );
      }

      if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Unit price must be a non-negative number` },
          { status: 400 }
        );
      }

      const discountPct = item.discount_pct || 0;
      if (typeof discountPct !== 'number' || discountPct < 0 || discountPct > 100) {
        return NextResponse.json(
          { error: `Item ${i + 1}: Discount percentage must be between 0 and 100` },
          { status: 400 }
        );
      }

      const lineTotal = item.quantity * item.unit_price;
      const discountAmount = (lineTotal * discountPct) / 100;
      additionalSubtotal += lineTotal;
      additionalDiscount += discountAmount;
    }

    // Prepare order items
    const orderItems = items.map((item: OrderItemInput) => {
      const lineTotal = item.quantity * item.unit_price;
      const discountAmount = (lineTotal * (item.discount_pct || 0)) / 100;

      return {
        order_id: orderId,
        product_id: item.product_id || null,
        product_variant_id: item.product_variant_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct || 0,
        discount_amount: discountAmount,
        line_total: lineTotal - discountAmount,
      };
    });

    // Insert order items
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw new Error(itemsError.message);

    // Update order totals
    const newSubtotal = order.subtotal + additionalSubtotal;
    const newDiscountTotal = order.discount_total + additionalDiscount;
    const newTotalAmount = newSubtotal - newDiscountTotal;
    const newBalanceDue = newTotalAmount - order.amount_paid;

    // Determine new status
    let newStatus = 'pending';
    if (order.amount_paid >= newTotalAmount) {
      newStatus = 'paid';
    } else if (order.amount_paid > 0) {
      newStatus = 'partial';
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        subtotal: newSubtotal,
        discount_total: newDiscountTotal,
        total_amount: newTotalAmount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    // Fetch complete updated order
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(
        `
        *,
        customer:customers(*),
        items:order_items(
          *,
          product:products(*),
          variant:product_variants(*)
        )
        `
      )
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    return NextResponse.json(
      {
        success: true,
        message: `${items.length} item(s) added to order`,
        data: completeOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add order items error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to add items to order',
      },
      { status: 500 }
    );
  }
}
