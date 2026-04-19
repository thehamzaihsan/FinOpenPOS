/**
 * Khata API - Add Transactions
 * POST /api/khata/[khataId]/transactions - Add transaction to khata account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { KhataTransactionInput } from '@/types/database.types';

/**
 * POST - Add transaction to khata account
 * Body: KhataTransactionInput
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ khataId: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { khataId } = await params;

    if (!khataId) {
      return NextResponse.json(
        { error: 'Khata ID is required' },
        { status: 400 }
      );
    }

    // Get current khata account
    const { data: account, error: accountError } = await supabase
      .from('khata_accounts')
      .select('*')
      .eq('id', khataId)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Khata account not found' },
        { status: 404 }
      );
    }

    const body = await request.json() as KhataTransactionInput;
    const { amount, transaction_type, description, order_id } = body;

    // Validation
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const validTypes = ['debit', 'credit'];
    if (!validTypes.includes(transaction_type)) {
      return NextResponse.json(
        {
          error: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Calculate new balance
    const balanceChange = transaction_type === 'debit' ? -amount : amount;
    const newBalance = account.current_balance + balanceChange;

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('khata_transactions')
      .insert([
        {
          khata_account_id: khataId,
          order_id: order_id || null,
          amount,
          transaction_type,
          description: description.trim(),
          balance_after: newBalance,
        },
      ])
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update khata account balance
    const { data: updatedAccount, error: updateError } = await supabase
      .from('khata_accounts')
      .update({
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', khataId)
      .select(
        `
        *,
        customer:customer_id(*)
        `
      )
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(
      {
        success: true,
        message: 'Transaction added successfully',
        data: {
          transaction,
          account: updatedAccount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Khata transaction error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to add khata transaction',
      },
      { status: 500 }
    );
  }
}
