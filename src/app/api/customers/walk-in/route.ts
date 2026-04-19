/**
 * Get Walk-in Customer
 * GET: Retrieve system walk-in customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_walk_in', true)
      .single();

    if (error && error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Walk-in customer not found' },
        { status: 404 }
      );
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Walk-in customer fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch walk-in customer' },
      { status: 500 }
    );
  }
}
