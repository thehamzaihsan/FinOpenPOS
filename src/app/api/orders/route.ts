import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      shop_id,
      total_amount,
      amount_paid,
      created_at,
      shop:shop_id (
        name
      )
      `)
    .eq('user_uid', user.id)
    .order('id', { ascending: true }); 
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}




export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { shopId, products, total, amount_paid , buy_total} = await request.json();

  if(amount_paid > total){
    return NextResponse.json(
      { error: `Ammount Paid Cannot be greater than total.` },
      { status: 500 }
    );
  }

  try {
    // Validate product stock
    for (const product of products) {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('in_stock , name')
        .eq('id', product.id)
        .single();

      if (productError) {
        throw productError;
      }

      if (productData.in_stock < product.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product ${productData.name}` },
          { status: 400 }
        );
      }
    }

    // Insert the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        shop_id: shopId,
        total_amount: total,
        amount_paid: amount_paid,
        user_uid: user.id,
        buy_amount: buy_total,
      })
      .select('*')
      .single();

    if (orderError) {
      throw orderError;
    }

    // Insert the order items
    const orderItems = products.map((product: { id: number, quantity: number, price: number }) => ({
      order_id: orderData.id,
      product_id: product.id,
      quantity: product.quantity,
      price: product.price,
      user_uid:user.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // If there's an error inserting order items, delete the order
      await supabase.from('orders').delete().eq('id', orderData.id);
      throw itemsError;
    }

    
    // Update the khata table
    const balance = amount_paid - total; // Calculate the balance
    console.log(user.id);
    const { error: khataError } = await supabase
      .from('khata')
      .insert({
        shop_id: shopId,
        balance: balance,
        transaction_date: new Date().toISOString(),
        user_uid:user.id,
        order_id:orderData.id,
      });

    if (khataError) {
      // If there's an error inserting into khata, delete the order and order items
      await supabase.from('orders').delete().eq('id', orderData.id);
      await supabase.from('order_items').delete().eq('order_id', orderData.id);
      throw khataError;
    }

    return NextResponse.json(orderData);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}