import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all records from the shop_balances view
    const { data, error } = await supabase
      .from('shop_balances')
      .select('*')
      .eq('user_uid', user.id); // Filter by the current user's ID

    if (error) {
      throw error;
    }

    // Log the raw data for debugging
    console.log('Raw data from shop_balances:', JSON.stringify(data, null, 2));

    // Return the fetched data
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}



export async function POST(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse the request body
    const { shopID, amount } = await request.json();

    // Validate the input
    if (!shopID || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid input: shopID and amount are required' },
        { status: 400 }
      );
    }

    // Fetch the current balance for the shop
    const { data: currentBalanceData, error: balanceError } = await supabase
      .from('shop_balances')
      .select('total_balance')
      .eq('shop_id', shopID)
      .eq('user_uid', user.id)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') { // Ignore "No rows found" error
      throw balanceError;
    }

    const currentBalance = currentBalanceData?.total_balance || 0;

    // Check if the new transaction will result in a negative balance
    if (currentBalance + amount > 1) {
      return NextResponse.json(
        { error: `Invalid transaction: Current balance (${currentBalance}) + Amount (${amount}) exceeds limit` },
        { status: 400 }
      );
    }

    // Insert the new record into the khata table
    const { data, error } = await supabase
      .from('khata')
      .insert([
        {
          shop_id: shopID,
          balance: amount,
          user_uid: user.id,
          transaction_date: new Date().toISOString(),
        },
      ])
      .select('*');

    if (error) {
      throw error;
    }

    // Return the inserted record
    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
