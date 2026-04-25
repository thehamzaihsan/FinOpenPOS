-- ============================================================
-- POS-SYS Final Schema Updates
-- Run this file in your Supabase SQL Editor to apply all changes
-- ============================================================

-- 1. Create shop_settings table for the Receipt Customizer
CREATE TABLE IF NOT EXISTS public.shop_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    shop_name VARCHAR(255) DEFAULT 'My Shop',
    phone VARCHAR(50) DEFAULT '',
    address TEXT DEFAULT '',
    return_policy TEXT DEFAULT 'No returns after 7 days.',
    logo_url TEXT DEFAULT '',
    font_family VARCHAR(50) DEFAULT 'monospace',
    thermal_header TEXT DEFAULT 'Thank you for shopping!',
    thermal_footer TEXT DEFAULT 'Visit us again!',
    standard_header TEXT DEFAULT 'Invoice / Receipt',
    standard_footer TEXT DEFAULT 'Thank you for your business.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on shop_settings
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for shop_settings
DROP POLICY IF EXISTS "user_own_settings_select" ON public.shop_settings;
DROP POLICY IF EXISTS "user_own_settings_insert" ON public.shop_settings;
DROP POLICY IF EXISTS "user_own_settings_update" ON public.shop_settings;

CREATE POLICY "user_own_settings_select" ON public.shop_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_own_settings_insert" ON public.shop_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_own_settings_update" ON public.shop_settings FOR UPDATE USING (user_id = auth.uid());

-- 4. Stock management functions (Deduct on order, Restock on refund)
DROP FUNCTION IF EXISTS public.increment_product_stock(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.increment_product_stock(prod_id UUID, amount INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.products
  SET quantity = GREATEST(0, quantity + amount)
  WHERE id = prod_id;
END;
$$;

DROP FUNCTION IF EXISTS public.increment_variant_stock(UUID, INTEGER);
CREATE OR REPLACE FUNCTION public.increment_variant_stock(variant_id UUID, amount INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.product_variants
  SET quantity = GREATEST(0, quantity + amount)
  WHERE id = variant_id;
END;
$$;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';