-- Preserve the date used for sorting when a transaction is first created.
-- Apply after 20260907020000_add_stable_transaction_sequence.sql.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS order_date DATE;

UPDATE public.transactions
SET order_date = date
WHERE order_date IS NULL;

ALTER TABLE public.transactions
  ALTER COLUMN order_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN order_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_order_date
  ON public.transactions (user_id, order_date DESC);
