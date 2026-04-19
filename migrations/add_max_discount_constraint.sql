-- ============================================================
-- Add constraint: Max discount cannot cause selling at loss
-- Formula: sale_price - (sale_price * max_discount / 100) >= purchase_price
-- ============================================================

ALTER TABLE products
ADD CONSTRAINT max_discount_no_loss_constraint
CHECK (sale_price - (sale_price * max_discount / 100) >= purchase_price);

-- Same for product variants
ALTER TABLE product_variants
ADD CONSTRAINT variant_max_discount_no_loss_constraint
CHECK (
  sale_price IS NULL 
  OR purchase_price IS NULL 
  OR max_discount IS NULL 
  OR sale_price - (sale_price * max_discount / 100) >= purchase_price
);
