/**
 * Database Test & Setup Route
 * Tests Supabase connection and verifies schema
 * Route: GET /api/db/test
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Supabase environment variables',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!serviceRoleKey,
          },
        },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Test 1: Check database connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact' });

    if (connectionError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
          details: connectionError,
        },
        { status: 500 }
      );
    }

    // Test 2: Verify all tables exist
    const tables = [
      'users',
      'customers',
      'products',
      'product_variants',
      'deals',
      'deal_items',
      'orders',
      'order_items',
      'khata_accounts',
      'khata_transactions',
      'expenses',
      'cash_summary',
    ];

    const tableChecks = await Promise.all(
      tables.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact' })
          .limit(0);

        return {
          table,
          exists: !error,
          error: error?.message || null,
        };
      })
    );

    const allTablesExist = tableChecks.every((t) => t.exists);

    // Test 3: Check walk-in customer
    const { data: walkIn, error: walkInError } = await supabase
      .from('customers')
      .select('*')
      .eq('is_walk_in', true)
      .single();

    // Test 4: Check admin user exists
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');

    // Test 5: Sample product check
    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact' });

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      checks: {
        database_connection: {
          status: 'ok',
          message: 'Successfully connected to Supabase',
        },
        tables: {
          status: allTablesExist ? 'ok' : 'warning',
          total: tables.length,
          verified: tableChecks.filter((t) => t.exists).length,
          details: tableChecks,
        },
        walk_in_customer: {
          status: walkIn ? 'ok' : 'missing',
          data: walkIn || null,
          error: walkInError?.message || null,
        },
        admin_users: {
          status: adminUsers && adminUsers.length > 0 ? 'ok' : 'missing',
          count: adminUsers?.length || 0,
          users: adminUsers?.map((u) => ({ email: u.email, name: u.name })) || [],
        },
        sample_products: {
          status: 'ok',
          count: productCount || 0,
        },
      },
      environment: {
        supabase_url: supabaseUrl?.substring(0, 20) + '...' || 'not set',
        service_role_key_set: !!serviceRoleKey,
      },
      setup_status: {
        database_ready: allTablesExist,
        walk_in_ready: !!walkIn,
        admin_ready: !!adminUsers && adminUsers.length > 0,
        fully_configured: allTablesExist && !!walkIn && !!adminUsers && adminUsers.length > 0,
      },
      next_steps:
        allTablesExist && !!walkIn && !!adminUsers && adminUsers.length > 0
          ? [
              '✅ Database is fully configured',
              '✅ Ready to use POS-SY application',
              'Go to /login to start',
            ]
          : [
              'Apply database migration: migrations/001_pos_complete_schema.sql',
              'Verify environment variables in .env.local',
              'Check Supabase dashboard for errors',
            ],
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error during database test',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
