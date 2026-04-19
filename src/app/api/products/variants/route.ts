/**
 * Product Variants API - Create variant
 * POST /api/products/variants
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProductVariantCreateInput } from '@/types/database.types';

/**
 * POST - Create product variant
 * Body: ProductVariantCreateInput
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as ProductVariantCreateInput;
    const {
      product_id,
      variant_name,
      item_code,
      purchase_price,
      sale_price,
      quantity,
      min_discount = 0,
      max_discount = 0,
    } = body;

    // Validation
    if (!product_id || !variant_name || !item_code || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, variant_name, item_code, quantity' },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity must be a non-negative number' },
        { status: 400 }
      );
    }

    if (purchase_price !== undefined && purchase_price < 0) {
      return NextResponse.json(
        { error: 'Purchase price cannot be negative' },
        { status: 400 }
      );
    }

    if (sale_price !== undefined && sale_price < 0) {
      return NextResponse.json(
        { error: 'Sale price cannot be negative' },
        { status: 400 }
      );
    }

    if (
      typeof min_discount !== 'number' ||
      typeof max_discount !== 'number' ||
      min_discount > max_discount ||
      max_discount > 100 ||
      min_discount < 0
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid discount range: min must be ≤ max, max must be ≤ 100, min must be ≥ 0',
        },
        { status: 400 }
      );
    }

    // Verify product exists
    const { data: productCheck, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', product_id)
      .eq('is_active', true)
      .single();

    if (productError || !productCheck) {
      return NextResponse.json(
        { error: 'Product not found or is inactive' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('product_variants')
      .insert([
        {
          product_id,
          variant_name: variant_name.trim(),
          item_code: item_code.trim(),
          purchase_price: purchase_price ? parseFloat(String(purchase_price)) : null,
          sale_price: sale_price ? parseFloat(String(sale_price)) : null,
          quantity: Math.floor(quantity),
          min_discount: parseFloat(String(min_discount)),
          max_discount: parseFloat(String(max_discount)),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Product variant creation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create product variant',
      },
      { status: 500 }
    );
  }
}
