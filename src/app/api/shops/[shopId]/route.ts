import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updatedCustomer = await request.json();
  const shopId = params.shopId;
  
  const { data, error } = await supabase
    .from('shops')
    .update({ ...updatedCustomer, user_uid: user.id })
    .eq('id', shopId)
    .eq('user_uid', user.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data.length === 0) {
    return NextResponse.json({ error: 'Customer not found or not authorized' }, { status: 404 })
  }

  return NextResponse.json(data[0])
}

export async function DELETE(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const shopId = params.shopId;

  const { error } = await supabase
    .from('shops')
    .delete()
    .eq('id', shopId)
    .eq('user_uid', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Customer deleted successfully' })
}
