import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { count, error } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching total Products:', error);
    return NextResponse.json({ error: 'Failed to fetch products data' }, { status: 500 });
  }

  

  return NextResponse.json({ count });
}
