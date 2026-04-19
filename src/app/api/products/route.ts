/**
 * Products API - Create
 * POST /api/products
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ProductCreateInput } from '@/types/database.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, image_url, purchase_price, sale_price, quantity, unit, item_code, min_discount, max_discount } = body;

    // Validation
    if (!name || purchase_price === undefined || sale_price === undefined || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, purchase_price, sale_price, quantity' },
        { status: 400 }
      );
    }

    if (min_discount === undefined || max_discount === undefined) {
      return NextResponse.json(
        { error: 'Discount fields are required' },
        { status: 400 }
      );
    }

    if (min_discount > max_discount || max_discount > 100) {
      return NextResponse.json(
        { error: 'Invalid discount range: min must be ≤ max, max must be ≤ 100' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name,
          description: description || null,
          image_url: image_url || null,
          purchase_price: parseFloat(purchase_price),
          sale_price: parseFloat(sale_price),
          quantity: parseInt(quantity),
          unit: unit || 'piece',
          item_code: item_code || null,
          min_discount: parseFloat(min_discount),
          max_discount: parseFloat(max_discount),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}

/**
 * Products API - List
 * GET /api/products?page=1&search=test
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,item_code.ilike.%${search}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Product list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
