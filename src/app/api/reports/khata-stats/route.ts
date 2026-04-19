/**
 * Reports API - Khata Statistics
 * GET /api/reports/khata-stats - Khata outstanding breakdown
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Fetch khata statistics and outstanding balances
 * Query params:
 * - outstanding_only: boolean (default: true, only show accounts with balance > 0)
 * - limit: number (default: 50, max: 500)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const outstandingOnly = searchParams.get('outstanding_only') !== 'false';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);

    // Fetch khata accounts with transaction details
    let query = supabase
      .from('khata_accounts')
      .select(
        `
        id,
        customer_id,
        current_balance,
        is_active,
        created_at,
        customer:customer_id(name, phone),
        transactions:khata_transactions(amount, transaction_type, created_at)
        `,
        { count: 'exact' }
      )
      .eq('is_active', true);

    const { data: accounts, count, error } = await query.limit(limit * 2); // Fetch more to filter

    if (error) throw error;

    // Filter and process accounts
    let stats = (accounts || [])
      .filter((acc: any) => !outstandingOnly || acc.current_balance > 0)
      .map((acc: any) => {
        const transactions = acc.transactions || [];
        const oldestTransaction = transactions.length > 0
          ? transactions[0].created_at
          : acc.created_at;

        const recentDebits = transactions
          .filter((t: any) => t.transaction_type === 'debit')
          .slice(-5)
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        return {
          customer_id: acc.customer_id,
          customer_name: acc.customer?.name || 'Unknown',
          phone: acc.customer?.phone || null,
          total_outstanding: acc.current_balance,
          transaction_count: transactions.length,
          oldest_transaction: oldestTransaction,
          recent_activity: recentDebits,
          account_id: acc.id,
        };
      })
      .slice(0, limit)
      .sort((a: any, b: any) => b.total_outstanding - a.total_outstanding);

    // Calculate summary
    const summary = {
      total_outstanding: 0,
      account_count: stats.length,
      average_balance: 0,
      largest_debt: 0,
    };

    stats.forEach((stat: any) => {
      summary.total_outstanding += stat.total_outstanding;
      summary.largest_debt = Math.max(summary.largest_debt, stat.total_outstanding);
    });

    if (stats.length > 0) {
      summary.average_balance = summary.total_outstanding / stats.length;
    }

    return NextResponse.json({
      success: true,
      data: stats,
      summary,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Khata stats report error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch khata statistics',
      },
      { status: 500 }
    );
  }
}
