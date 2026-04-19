/**
 * Customers API - Detail operations
 * GET: Get single customer
 * PUT: Update customer
 * DELETE: Soft delete customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const supabase = await createClient();
    const { customerId } = await params;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('is_active', true)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Customer fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const supabase = await createClient();
    const { customerId } = await params;
    const body = await request.json();

    const updates: Record<string, any> = {};
    const allowedFields = ['name', 'phone', 'address'];

    allowedFields.forEach((field) => {
      if (field in body) {
        updates[field] = body[field];
      }
    });

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .eq('is_active', true)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const supabase = await createClient();
    const { customerId } = await params;

    // Soft delete
    const { data, error } = await supabase
      .from('customers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', customerId)
      .eq('is_active', true)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
      data,
    });
  } catch (error) {
    console.error('Customer delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
