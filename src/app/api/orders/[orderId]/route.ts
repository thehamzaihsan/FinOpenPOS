/**
 * Orders API - Single Order Operations
 * GET /api/orders/[orderId] - Get single order with items
 * PUT /api/orders/[orderId] - Update order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OrderUpdateInput } from '@/types/database.types';

/**
 * GET - Fetch single order with items
 */
export async function GET(
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

    const { data, error } = await supabase
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
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch order',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update order (payment info, status, notes)
 */
export async function PUT(
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

    const body = await request.json() as OrderUpdateInput;

    // Get current order to calculate balance
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate input types
    if (body.amount_paid !== undefined) {
      if (typeof body.amount_paid !== 'number' || body.amount_paid < 0) {
        return NextResponse.json(
          { error: 'Amount paid must be a non-negative number' },
          { status: 400 }
        );
      }

      if (body.amount_paid > currentOrder.total_amount) {
        // Allowed - customer pays more
      }
    }

    if (body.payment_method !== undefined) {
      const validPaymentMethods = ['cash', 'card', 'bank_transfer', 'khata'];
      if (!validPaymentMethods.includes(body.payment_method)) {
        return NextResponse.json(
          {
            error: `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    if (body.status !== undefined) {
      const validStatuses = ['pending', 'paid', 'partial', 'refunded'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {};
    const amountPaid = body.amount_paid !== undefined ? body.amount_paid : currentOrder.amount_paid;

    if (body.amount_paid !== undefined) {
      updateData.amount_paid = amountPaid;
      updateData.balance_due = Math.max(0, currentOrder.total_amount - amountPaid);

      // Auto-update status based on amount paid
      if (amountPaid === 0) {
        updateData.status = 'pending';
      } else if (amountPaid >= currentOrder.total_amount) {
        updateData.status = 'paid';
      } else if (amountPaid > 0) {
        updateData.status = 'partial';
      }
    }

    if (body.payment_method !== undefined) updateData.payment_method = body.payment_method;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.is_khata !== undefined) updateData.is_khata = body.is_khata;
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 1) {
      // Only updated_at
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update order',
      },
      { status: 500 }
    );
  }
}
