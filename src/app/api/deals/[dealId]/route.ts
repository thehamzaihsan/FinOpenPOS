/**
 * Deals API - Single Deal Operations
 * GET /api/deals/[dealId] - Get single deal
 * PUT /api/deals/[dealId] - Update deal
 * DELETE /api/deals/[dealId] - Soft delete deal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DealUpdateInput } from '@/types/database.types';

/**
 * GET - Fetch single deal with items
 */
export async function GET(
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

    const { data, error } = await supabase
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
      .eq('id', dealId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Deal fetch error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch deal',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update deal
 */
export async function PUT(
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

    const body = await request.json() as DealUpdateInput;

    // Prepare update data
    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 1) {
      // Only updated_at
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', dealId);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Fetch updated deal
    const { data, error: fetchError } = await supabase
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
      .eq('id', dealId)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Deal update error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update deal',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Soft delete deal
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

    const { data, error } = await supabase
      .from('deals')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Deal deleted successfully',
      data,
    });
  } catch (error) {
    console.error('Deal delete error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete deal',
      },
      { status: 500 }
    );
  }
}
