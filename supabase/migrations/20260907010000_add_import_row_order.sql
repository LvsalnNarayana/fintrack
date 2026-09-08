-- Preserve the original row order for imported statements.
-- Apply after 20260906000000_init.sql and the auth trigger migration.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS import_row_number INTEGER;

CREATE INDEX IF NOT EXISTS idx_transactions_import_order
  ON public.transactions (user_id, created_at, import_row_number);
