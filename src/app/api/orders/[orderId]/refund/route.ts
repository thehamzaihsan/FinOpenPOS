/**
 * Orders API - Refund Management
 * POST /api/orders/[orderId]/refund - Process full or partial refund
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OrderRefundInput } from '@/types/database.types';

/**
 * POST - Process refund for order
 * Body: OrderRefundInput
 * Creates refund record and updates order status
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

    const body = await request.json() as OrderRefundInput;
    const { refund_amount, reason } = body;

    // Validation
    if (typeof refund_amount !== 'number' || refund_amount <= 0) {
      return NextResponse.json(
        { error: 'Refund amount must be a positive number' },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Refund reason is required' },
        { status: 400 }
      );
    }

    // Get current order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Validate refund amount
    if (refund_amount > order.amount_paid) {
      return NextResponse.json(
        {
          error: `Refund amount cannot exceed amount paid (${order.amount_paid})`,
        },
        { status: 400 }
      );
    }

    // Calculate new amounts
    const newAmountPaid = order.amount_paid - refund_amount;
    const newBalanceDue = order.total_amount - newAmountPaid;

    // Determine new status
    let newStatus = 'pending';
    if (newAmountPaid === 0) {
      newStatus = 'refunded';
    } else if (newAmountPaid >= order.total_amount) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Note: You may want to create a refunds table to track individual refunds
    // For now, we just update the order

    return NextResponse.json({
      success: true,
      message: `Refund of ${refund_amount} processed`,
      data: {
        order: updatedOrder,
        refund: {
          amount: refund_amount,
          reason,
          refund_date: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process refund',
      },
      { status: 500 }
    );
  }
}
