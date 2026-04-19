/**
 * Deals API - Deal Items Management
 * POST /api/deals/[dealId]/items - Add items to deal
 * DELETE /api/deals/[dealId]/items - Remove items from deal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DealItemInput } from '@/types/database.types';

/**
 * POST - Add items to deal
 * Body: { items: DealItemInput[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = await params;

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    // Verify deal exists
    const { data: dealCheck, error: dealError } = await supabase
      .from('deals')
      .select('id')
      .eq('id', dealId)
      .eq('is_active', true)
      .single();

    if (dealError || !dealCheck) {
      return NextResponse.json(
        { error: 'Deal not found or is inactive' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Must provide at least one item' },
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

    // Prepare deal items
    const dealItems = items.map((item: DealItemInput) => ({
      deal_id: dealId,
      product_id: item.product_id || null,
      product_variant_id: item.product_variant_id || null,
      quantity: item.quantity,
    }));

    // Insert deal items
    const { data, error } = await supabase
      .from('deal_items')
      .insert(dealItems)
      .select(
        `
        *,
        product:product_id(*),
        variant:product_variant_id(*)
        `
      );

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Items added to deal', data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Deal items addition error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to add items to deal',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove items from deal
 * Body: { item_ids: string[] }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dealId } = await params;

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { item_ids } = body;

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json(
        { error: 'Must provide at least one item ID to delete' },
        { status: 400 }
      );
    }

    // Verify items belong to this deal
    const { data: itemsCheck, error: checkError } = await supabase
      .from('deal_items')
      .select('id')
      .eq('deal_id', dealId)
      .in('id', item_ids);

    if (checkError) throw checkError;

    if (!itemsCheck || itemsCheck.length !== item_ids.length) {
      return NextResponse.json(
        { error: 'Some item IDs do not belong to this deal' },
        { status: 400 }
      );
    }

    // Delete items
    const { error } = await supabase
      .from('deal_items')
      .delete()
      .in('id', item_ids);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${item_ids.length} item(s) removed from deal`,
    });
  } catch (error) {
    console.error('Deal items deletion error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to remove items from deal',
      },
      { status: 500 }
    );
  }
}
