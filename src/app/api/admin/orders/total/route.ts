import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();

  // Authenticate the user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch the total number of products for the authenticated user
    const { count, error: fetchError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_uid', user.id);

    if (fetchError) {
      console.error('Error fetching total products:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch products data' }, { status: 500 });
    }

    // Return the counttotalExpensestotalExpenses of products
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}