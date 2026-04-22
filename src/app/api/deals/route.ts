/**
 * Deals API - List and Create
 * GET /api/deals - List all active deals
 * POST /api/deals - Create new deal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DealCreateInput } from '@/types/database.types';

/**
 * GET - List all active deals with pagination
 * Query params:
 * - page: number (default: 1)
 * - pageSize: number (default: 10)
 * - search: string (searches name, description)
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

    // Validate pagination
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('deals')
      .select(
        `
        *,
        items:deal_items(
          *,
          product:product_id(*),
          variant:product_variant_id(*)
        )
        `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasMore: page < Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Deal list error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch deals',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new deal with items
 * Body: DealCreateInput
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as DealCreateInput;
    const { name, description, items } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Deal name is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Deal must contain at least one item' },
        { status: 400 }
      );
    }

    // Validate items
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
    }

    // Insert deal
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert([
        {
          user_id: user.id,
          name: name.trim(),
          description: description?.trim() || null,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (dealError) throw dealError;

    // Prepare deal items
    const dealItems = items.map((item) => ({
      deal_id: deal.id,
      product_id: item.product_id || null,
      product_variant_id: item.product_variant_id || null,
      quantity: item.quantity,
    }));

    // Insert deal items
    const { data: insertedItems, error: itemsError } = await supabase
      .from('deal_items')
      .insert(dealItems)
      .select();

    if (itemsError) {
      // Rollback deal creation
      await supabase.from('deals').delete().eq('id', deal.id);
      throw itemsError;
    }

    // Fetch complete deal with items
    const { data: completeDeal, error: fetchError } = await supabase
      .from('deals')
      .select(
        `
        *,
        items:deal_items(
          *,
          product:product_id(*),
          variant:product_variant_id(*)
        )
        `
      )
      .eq('id', deal.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ success: true, data: completeDeal }, { status: 201 });
  } catch (error) {
    console.error('Deal creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create deal',
      },
      { status: 500 }
    );
  }
}
