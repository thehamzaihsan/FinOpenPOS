/**
 * Products API - Lookup by barcode/item code
 * GET /api/products/by-code/[itemCode]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Lookup product by item code/barcode
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemCode: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemCode } = await params;

    if (!itemCode) {
      return NextResponse.json(
        { error: 'Item code is required' },
        { status: 400 }
      );
    }

    // First try to find in products table
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('item_code', itemCode)
      .eq('is_active', true)
      .maybeSingle();

    if (productError && productError.code !== 'PGRST116') {
      throw productError;
    }

    // If found in products, return with type 'product'
    if (product) {
      return NextResponse.json({
        success: true,
        type: 'product',
        data: product,
      });
    }

    // Try to find in product variants
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select(
        `
        *,
        product:product_id(*)
        `
      )
      .eq('item_code', itemCode)
      .eq('is_active', true)
      .maybeSingle();

    if (variantError && variantError.code !== 'PGRST116') {
      throw variantError;
    }

    if (variant) {
      return NextResponse.json({
        success: true,
        type: 'variant',
        data: variant,
      });
    }

    return NextResponse.json(
      { error: 'Product not found with this item code' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Product lookup error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to lookup product',
      },
      { status: 500 }
    );
  }
}
