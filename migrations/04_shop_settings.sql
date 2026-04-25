-- ============================================================
-- POS-SYS Shop Settings for Customizer Migration
-- ============================================================

CREATE TABLE IF NOT EXISTS shop_settings (
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

-- RLS
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- Only owner can view their own settings
CREATE POLICY "user_own_settings_select" ON shop_settings FOR SELECT USING (user_id = auth.uid());

-- Only owner can insert their own settings
CREATE POLICY "user_own_settings_insert" ON shop_settings FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only owner can update their own settings
CREATE POLICY "user_own_settings_update" ON shop_settings FOR UPDATE USING (user_id = auth.uid());
