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

    const body = await request.json() as OrderRefundInput & {
      returned_items?: { order_item_id: string; product_id: string; return_quantity: number }[];
    };
    const { refund_amount, reason, returned_items } = body;

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
      .eq('user_id', user.id)
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

    // --- KHATA REFUND ADJUSTMENT ---
    if (order.is_khata && order.customer_id) {
      const { data: khataAccount } = await supabase
        .from('khata_accounts')
        .select('id, current_balance')
        .eq('customer_id', order.customer_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (khataAccount) {
        // If we refund money, the customer's debt (current_balance) actually increases 
        // because we are giving back the cash they paid, so more is owed on the order.
        // HOWEVER, if we are returning items, the debt decreases.
        // Let's see how the user intends this. 
        // Usually, a refund on a Khata order means:
        // 1. Give cash back (increases debt) OR 
        // 2. Reduce debt (credit the account)
        
        // If returned_items are NOT present, it's a cash refund.
        if (!returned_items || returned_items.length === 0) {
          const newKhataBalance = khataAccount.current_balance + refund_amount;
          
          await supabase.from('khata_transactions').insert({
            khata_account_id: khataAccount.id,
            user_id: user.id,
            order_id: orderId,
            amount: refund_amount,
            transaction_type: 'debit',
            description: `Refund adjustment (Cash back) for Order #${orderId.slice(0, 8)}`,
            balance_after: newKhataBalance
          });

          await supabase
            .from('khata_accounts')
            .update({ current_balance: newKhataBalance, updated_at: new Date().toISOString() })
            .eq('id', khataAccount.id);
        }
      }
    }
    // --- END KHATA REFUND ADJUSTMENT ---

    // Determine new status
    let newStatus = 'pending';
    if (newAmountPaid === 0 && order.total_amount === 0) {
      newStatus = 'refunded'; // Should we also consider when all items are returned?
    } else if (newAmountPaid === 0) {
      newStatus = 'refunded';
    } else if (newAmountPaid >= order.total_amount) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }

    if (returned_items && returned_items.length > 0) {
      let total_deduction = 0;
      for (const item of returned_items) {
        if (item.return_quantity > 0) {
          // Get order item
          const { data: orderItem } = await supabase
            .from('order_items')
            .select('*')
            .eq('id', item.order_item_id)
            .single();
          
          if (orderItem) {
            const newQty = orderItem.quantity - item.return_quantity;
            const newTotal = (orderItem.unit_price * newQty) - (orderItem.discount_amount || 0); // Assuming discount is fixed, might need proportionate discount adjustment, but keep simple
            const proportion = newQty / orderItem.quantity;
            const newDiscount = (orderItem.discount_amount || 0) * proportion;
            const updatedTotal = (orderItem.unit_price * newQty) - newDiscount;

            await supabase
              .from('order_items')
              .update({ quantity: newQty, discount_amount: newDiscount, line_total: updatedTotal })
              .eq('id', item.order_item_id);
            
            total_deduction += orderItem.line_total - updatedTotal;

            // Restock product/variant
            if (item.product_id) {
              // Check if it was a variant return (order_item might have product_variant_id)
              if (orderItem.product_variant_id) {
                await supabase.rpc('increment_variant_stock', {
                  variant_id: orderItem.product_variant_id,
                  amount: item.return_quantity
                });
              } else {
                await supabase.rpc('increment_product_stock', {
                  prod_id: item.product_id,
                  amount: item.return_quantity
                });
              }
            }
          }
        }
      }

      const newOrderTotal = order.total_amount - total_deduction;
      const newBalanceDue = newOrderTotal - newAmountPaid;

      // --- KHATA ITEM RETURN ADJUSTMENT ---
      if (order.is_khata && order.customer_id) {
        const { data: khataAccount } = await supabase
          .from('khata_accounts')
          .select('id, current_balance')
          .eq('customer_id', order.customer_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (khataAccount) {
          // deduction reduces the total debt.
          // cash refund increases the debt.
          // net change = refund_amount - total_deduction? 
          // Example: Order 1000, Paid 800, Debt 200.
          // Return item worth 100. Refund 0. New Total 900. New Paid 800. New Debt 100. (Reduced by 100)
          // Return item worth 100. Refund 50. New Total 900. New Paid 750. New Debt 150. (Reduced by 50)
          
          const netCredit = total_deduction - refund_amount;
          const newKhataBalance = khataAccount.current_balance - netCredit;

          await supabase.from('khata_transactions').insert({
            khata_account_id: khataAccount.id,
            user_id: user.id,
            order_id: orderId,
            amount: Math.abs(netCredit),
            transaction_type: netCredit >= 0 ? 'credit' : 'debit',
            description: `Item return adjustment for Order #${orderId.slice(0, 8)}`,
            balance_after: newKhataBalance
          });

          await supabase
            .from('khata_accounts')
            .update({ current_balance: newKhataBalance, updated_at: new Date().toISOString() })
            .eq('id', khataAccount.id);
        }
      }
      // --- END KHATA ITEM RETURN ADJUSTMENT ---

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          total_amount: newOrderTotal,
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          status: newBalanceDue <= 0 ? (newOrderTotal === 0 ? 'refunded' : 'paid') : 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('user_id', user.id)
        .select()
        .single();
      if (updateError) throw updateError;
      return NextResponse.json({
        success: true,
        message: `Refund of ${refund_amount} processed and items returned`,
        data: {
          order: updatedOrder,
          refund: {
            amount: refund_amount,
            reason,
            refund_date: new Date().toISOString(),
          },
        },
      });
    }

    // Update order (if no returned_items)
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('user_id', user.id)
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
