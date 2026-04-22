/**
 * Khata API - Statement (for PDF/Reports)
 * GET /api/khata/[khataId]/statement - Full khata statement
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Fetch complete khata statement for PDF/reports
 * Query params:
 * - date_from: ISO date string (optional)
 * - date_to: ISO date string (optional)
 */
export async function GET(
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

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Get khata account
    const { data: account, error: accountError } = await supabase
      .from('khata_accounts')
      .select(
        `
        *,
        customer:customer_id(*)
        `
      )
      .eq('id', khataId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Khata account not found' },
        { status: 404 }
      );
    }

    // Get transactions
    let transactionQuery = supabase
      .from('khata_transactions')
      .select(
        `
        *,
        order:order_id(*)
        `
      )
      .eq('khata_account_id', khataId)
      .order('created_at', { ascending: true });

    if (dateFrom) {
      transactionQuery = transactionQuery.gte('created_at', dateFrom);
    }

    if (dateTo) {
      transactionQuery = transactionQuery.lte('created_at', dateTo);
    }

    const { data: transactions, error: transactionError } = await transactionQuery;

    if (transactionError) throw transactionError;

    // Calculate statement summary
    const summary = {
      opening_balance: account.opening_balance,
      total_debits: 0,
      total_credits: 0,
      current_balance: account.current_balance,
      transaction_count: transactions?.length || 0,
    };

    (transactions || []).forEach((t: any) => {
      if (t.transaction_type === 'debit') {
        summary.total_debits += t.amount;
      } else {
        summary.total_credits += t.amount;
      }
    });

    // Prepare statement for PDF
    const statement = {
      customer: account.customer,
      account: {
        id: account.id,
        opening_balance: account.opening_balance,
        current_balance: account.current_balance,
        is_active: account.is_active,
        created_at: account.created_at,
        updated_at: account.updated_at,
      },
      period: {
        from: dateFrom || account.created_at,
        to: dateTo || new Date().toISOString(),
      },
      transactions: transactions || [],
      summary,
      generated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: statement,
    });
  } catch (error) {
    console.error('Khata statement fetch error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch khata statement',
      },
      { status: 500 }
    );
  }
}
