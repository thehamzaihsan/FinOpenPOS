/**
 * Products API - List & Create
 * GET: List products with pagination/search
 * POST: Create new product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10')));
    const search = searchParams.get('search') || '';

    const supabase = await createClient();

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,item_code.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('Product list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Product list exception:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      image_url,
      purchase_price,
      sale_price,
      quantity,
      unit,
      item_code,
      min_discount,
      max_discount,
    } = body;

    // Validation
    if (!name || purchase_price === undefined || sale_price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, purchase_price, sale_price' },
        { status: 400 }
      );
    }

    if (typeof purchase_price !== 'number' || typeof sale_price !== 'number') {
      return NextResponse.json(
        { error: 'Price fields must be numbers' },
        { status: 400 }
      );
    }

    if (min_discount === undefined || max_discount === undefined) {
      return NextResponse.json(
        { error: 'Discount fields required' },
        { status: 400 }
      );
    }

    if (min_discount < 0 || max_discount > 100 || min_discount > max_discount) {
      return NextResponse.json(
        { error: 'Invalid discount: min >= 0, max <= 100, min <= max' },
        { status: 400 }
      );
    }

    if (sale_price < purchase_price) {
      return NextResponse.json(
        { error: 'Sale price must be greater than or equal to purchase price' },
        { status: 400 }
      );
    }

    // Calculate max allowed discount: ((sale_price - purchase_price) / sale_price) * 100
    const maxAllowedDiscount = sale_price > 0 
      ? ((sale_price - purchase_price) / sale_price) * 100 
      : 0;

    if (max_discount > maxAllowedDiscount) {
      return NextResponse.json(
        { 
          error: `Max discount cannot exceed ${maxAllowedDiscount.toFixed(2)}% without causing a loss. At that discount level, the final price would be below the purchase price.`,
          maxAllowedDiscount: parseFloat(maxAllowedDiscount.toFixed(2))
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: name.trim(),
          description: description || null,
          image_url: image_url || null,
          purchase_price,
          sale_price,
          quantity: parseInt(quantity) || 0,
          unit: unit || 'piece',
          item_code: item_code || null,
          min_discount,
          max_discount,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Product creation error:', error);
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
    console.error('Product creation exception:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
