import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let { data: settings, error } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error("GET Shop settings error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no settings exist yet, return a default object
    if (!settings) {
      settings = {
        shop_name: 'My Shop',
        phone: '',
        address: '',
        return_policy: 'No returns after 7 days.',
        logo_url: '',
        font_family: 'monospace',
        thermal_header: 'Thank you for shopping!',
        thermal_footer: 'Visit us again!',
        standard_header: 'Invoice / Receipt',
        standard_footer: 'Thank you for your business.',
      };
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if exists
    const { data: existing } = await supabase
      .from('shop_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      shop_name: body.shop_name || 'My Shop',
      phone: body.phone || '',
      address: body.address || '',
      return_policy: body.return_policy || '',
      logo_url: body.logo_url || '',
      font_family: body.font_family || 'monospace',
      thermal_header: body.thermal_header || '',
      thermal_footer: body.thermal_footer || '',
      standard_header: body.standard_header || '',
      standard_footer: body.standard_footer || '',
      updated_at: new Date().toISOString()
    };

    let result;

    if (existing) {
      result = await supabase
        .from('shop_settings')
        .update(payload)
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('shop_settings')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      console.error("PUT Shop settings error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
