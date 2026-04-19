-- ============================================================
-- Add constraint: Sale price must be >= purchase price
-- ============================================================

ALTER TABLE products
ADD CONSTRAINT sale_price_min_constraint
CHECK (sale_price >= purchase_price);

-- Same for product variants
ALTER TABLE product_variants
ADD CONSTRAINT variant_sale_price_min_constraint
CHECK (sale_price IS NULL OR purchase_price IS NULL OR sale_price >= purchase_price);
