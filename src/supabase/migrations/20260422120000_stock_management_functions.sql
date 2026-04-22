CREATE OR REPLACE FUNCTION public.increment_product_stock(prod_id uuid, amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET quantity = quantity + amount
  WHERE id = prod_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_variant_stock(variant_id uuid, amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.product_variants
  SET quantity = quantity + amount
  WHERE id = variant_id;
END;
$$;
