/**
 * Product Variants API
 * POST: Create variant
 * PUT: Update variant
 * DELETE: Delete variant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      product_id,
      variant_name,
      item_code,
      purchase_price,
      sale_price,
      quantity,
      min_discount,
      max_discount,
    } = body;

    if (!product_id || !variant_name) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, variant_name' },
        { status: 400 }
      );
    }

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('product_variants')
      .insert([
        {
          product_id,
          variant_name: variant_name.trim(),
          item_code: item_code || null,
          purchase_price: purchase_price || null,
          sale_price: sale_price || null,
          quantity: parseInt(quantity) || 0,
          min_discount: min_discount || null,
          max_discount: max_discount || null,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Item code already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Variant creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create variant' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; variantId: string }> }
) {
  try {
    const supabase = await createClient();
    const { variantId } = await params;
    const body = await request.json();

    const updates: Record<string, any> = {};
    const allowedFields = [
      'variant_name',
      'purchase_price',
      'sale_price',
      'quantity',
      'min_discount',
      'max_discount',
    ];

    allowedFields.forEach((field) => {
      if (field in body) {
        updates[field] = body[field];
      }
    });

    const { data, error } = await supabase
      .from('product_variants')
      .update(updates)
      .eq('id', variantId)
      .eq('is_active', true)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Variant update error:', error);
    return NextResponse.json(
      { error: 'Failed to update variant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; variantId: string }> }
) {
  try {
    const supabase = await createClient();
    const { variantId } = await params;

    // Soft delete
    const { data, error } = await supabase
      .from('product_variants')
      .update({ is_active: false })
      .eq('id', variantId)
      .eq('is_active', true)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
      data,
    });
  } catch (error) {
    console.error('Variant delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete variant' },
      { status: 500 }
    );
  }
}
