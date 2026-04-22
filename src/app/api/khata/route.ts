/**
 * Khata API - List and Create
 * GET /api/khata - List all khata accounts
 * POST /api/khata - Create new khata account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { KhataAccountCreateInput } from '@/types/database.types';

/**
 * GET - List all khata accounts with pagination
 * Query params:
 * - page: number (default: 1)
 * - pageSize: number (default: 10)
 * - search: string (searches customer name)
 * - sortBy: string (default: updated_at)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'updated_at';

    // Validate pagination
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('khata_accounts')
      .select(
        `
        *,
        customer:customer_id(*)
        `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Apply search filter
    if (search) {
      // Need to search in customer name - this is complex in Supabase
      // For now, fetch and filter in app
      query = query.order(sortBy, { ascending: false });
    } else {
      query = query.order(sortBy, { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    // If search, filter in application
    let filtered = data || [];
    if (search) {
      filtered = filtered.filter((acc: any) =>
        acc.customer?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasMore: page < Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Khata accounts list error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch khata accounts',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new khata account
 * Body: KhataAccountCreateInput
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as KhataAccountCreateInput;
    const { customer_id, opening_balance = 0 } = body;

    // Validation
    if (!customer_id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    if (typeof opening_balance !== 'number' || opening_balance < 0) {
      return NextResponse.json(
        { error: 'Opening balance must be a non-negative number' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found or is inactive' },
        { status: 404 }
      );
    }

    // Check if khata account already exists
    const { data: existing, error: checkError } = await supabase
      .from('khata_accounts')
      .select('id')
      .eq('customer_id', customer_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Khata account already exists for this customer' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('khata_accounts')
      .insert([
        {
          user_id: user.id,
          customer_id,
          opening_balance,
          current_balance: opening_balance,
          is_active: true,
        },
      ])
      .select(
        `
        *,
        customer:customer_id(*)
        `
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Khata account creation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create khata account',
      },
      { status: 500 }
    );
  }
}
