/**
 * Khata API - Customer Khata Lookup
 * GET /api/khata/customer/[customerId] - Get customer's khata account if exists
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Find and return customer's khata account if it exists
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId } = await params;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Try to find khata account
    const { data: khata, error: khataError } = await supabase
      .from('khata_accounts')
      .select(
        `
        *,
        customer:customer_id(*),
        transactions:khata_transactions(
          id,
          amount,
          transaction_type,
          description,
          balance_after,
          created_at
        )
        `
      )
      .eq('customer_id', customerId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (khataError && khataError.code !== 'PGRST116') {
      throw khataError;
    }

    if (!khata) {
      return NextResponse.json(
        {
          success: true,
          data: null,
          message: 'No khata account found for this customer',
        },
        { status: 200 }
      );
    }

    // Get recent transactions for summary
    const recentTransactions = (khata.transactions || []).slice(-10);

    return NextResponse.json({
      success: true,
      data: khata,
      recent_transactions: recentTransactions,
      exists: true,
    });
  } catch (error) {
    console.error('Customer khata lookup error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to lookup customer khata',
      },
      { status: 500 }
    );
  }
}
