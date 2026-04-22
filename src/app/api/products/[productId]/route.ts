/**
 * Products API - Get, Update, Delete
 * GET: Get single product
 * PUT: Update product
 * DELETE: Soft delete product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;
    const body = await request.json();

    // Validate discount if provided
    if (body.min_discount !== undefined && body.max_discount !== undefined) {
      if (body.min_discount < 0 || body.max_discount > 100 || body.min_discount > body.max_discount) {
        return NextResponse.json(
          { error: 'Invalid discount range' },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, any> = {};
    const allowedFields = [
      'name',
      'description',
      'image_url',
      'purchase_price',
      'sale_price',
      'quantity',
      'unit',
      'item_code',
      'min_discount',
      'max_discount',
    ];

    allowedFields.forEach((field) => {
      if (field in body) {
        updates[field] = body[field];
      }
    });

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Item code already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;

    // Soft delete
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      data,
    });
  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
