-- ====================================================================
-- CLEAR ALL DATA EXCEPT INVENTORY  (one-off, run manually in the
-- Supabase SQL Editor — NOT a migration). IRREVERSIBLE: take a backup
-- first (Dashboard -> Database -> Backups) if you might need anything.
--
-- KEPT (inventory + setup):
--   products, product_variants, categories, barcode_registry
--   (current stock levels stay as they are), barcode sequences,
--   store_settings, portal_credentials, profiles, seed_ledger.
--
-- WIPED:
--   orders, order_items                      (all bills / sales)
--   advance_orders, _payments, _timeline     (all advance orders)
--   inventory_movements                      (stock in/out history)
--   expenses, expense_categories
--   attendance_records, staff_members
--   coupons, store_reviews
--   invoice / deposit / customer-code counters are reset to the start.
--
-- TRUNCATE is used (not DELETE) so per-row delete triggers do not fire —
-- e.g. nothing tries to "return" sold items to stock while bills are wiped.
-- ====================================================================

BEGIN;

DO $$
DECLARE
  t TEXT;
  existing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'order_items', 'orders',
    'advance_order_payments', 'advance_order_timeline', 'advance_orders',
    'inventory_movements',
    'expenses', 'expense_categories',
    'attendance_records', 'staff_members',
    'coupons', 'store_reviews'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      existing := existing || format('public.%I', t);
    END IF;
  END LOOP;

  IF array_length(existing, 1) > 0 THEN
    -- No CASCADE on purpose: if some table outside this list still points
    -- at one of these, the whole script fails and nothing is removed.
    EXECUTE 'TRUNCATE ' || array_to_string(existing, ', ') || ' RESTART IDENTITY';
  END IF;
END $$;

-- Restart bill / deposit / customer numbering from the beginning.
DO $$
BEGIN
  IF to_regclass('public.invoice_number_seq_pos1') IS NOT NULL THEN
    PERFORM setval('public.invoice_number_seq_pos1', 10000001, FALSE);
  END IF;
  IF to_regclass('public.invoice_number_seq_pos2') IS NOT NULL THEN
    PERFORM setval('public.invoice_number_seq_pos2', 50000001, FALSE);
  END IF;
  IF to_regclass('public.invoice_number_seq') IS NOT NULL THEN
    PERFORM setval('public.invoice_number_seq', 1, FALSE);
  END IF;
  IF to_regclass('public.deposit_number_seq') IS NOT NULL THEN
    PERFORM setval('public.deposit_number_seq', 1, FALSE);
  END IF;
  IF to_regclass('public.customer_code_seq') IS NOT NULL THEN
    PERFORM setval('public.customer_code_seq', 1, FALSE);
  END IF;
  IF to_regclass('public.invoice_counter') IS NOT NULL THEN
    UPDATE public.invoice_counter
       SET counter = 0, year = EXTRACT(YEAR FROM NOW())::INTEGER, updated_at = NOW();
  END IF;
END $$;

COMMIT;

-- Check: wiped tables should show 0, inventory tables their normal counts.
SELECT 'orders' AS tbl, COUNT(*) FROM public.orders
UNION ALL SELECT 'advance_orders', COUNT(*) FROM public.advance_orders
UNION ALL SELECT 'expenses', COUNT(*) FROM public.expenses
UNION ALL SELECT 'inventory_movements', COUNT(*) FROM public.inventory_movements
UNION ALL SELECT 'staff_members', COUNT(*) FROM public.staff_members
UNION ALL SELECT 'coupons', COUNT(*) FROM public.coupons
UNION ALL SELECT 'products (kept)', COUNT(*) FROM public.products
UNION ALL SELECT 'product_variants (kept)', COUNT(*) FROM public.product_variants
UNION ALL SELECT 'barcode_registry (kept)', COUNT(*) FROM public.barcode_registry;
