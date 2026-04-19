/**
 * Khata API - Single Khata Account
 * GET /api/khata/[khataId] - Get khata account with transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Fetch khata account with recent transactions
 * Query params:
 * - limit: number (default: 50, max: 1000)
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000);

    const { data, error } = await supabase
      .from('khata_accounts')
      .select(
        `
        *,
        customer:customer_id(*),
        transactions:khata_transactions(*, order:order_id(*))
        `
      )
      .eq('id', khataId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Khata account not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Limit transactions
    const transactions = (data.transactions || []).slice(0, limit);

    // Calculate summary
    const summary = {
      total_debits: 0,
      total_credits: 0,
      transaction_count: transactions.length,
    };

    transactions.forEach((t: any) => {
      if (t.transaction_type === 'debit') {
        summary.total_debits += t.amount;
      } else {
        summary.total_credits += t.amount;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        transactions,
      },
      summary,
    });
  } catch (error) {
    console.error('Khata account fetch error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch khata account',
      },
      { status: 500 }
    );
  }
}
