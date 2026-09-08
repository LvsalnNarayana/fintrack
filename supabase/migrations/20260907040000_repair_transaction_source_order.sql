-- Repair source ordering for existing transactions.
-- Apply after 20260907030000_add_immutable_order_date.sql.
-- This migration does not use updated_at.

CREATE SEQUENCE IF NOT EXISTS public.transactions_import_sequence_seq;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS import_sequence BIGINT;

DROP INDEX IF EXISTS public.uq_transactions_import_sequence;

WITH ordered_transactions AS (
  SELECT id,
    row_number() OVER (
      ORDER BY created_at ASC, import_batch_id ASC NULLS FIRST,
               import_row_number ASC NULLS LAST, id ASC
    ) AS sequence_number
  FROM public.transactions
)
UPDATE public.transactions AS transactions
SET import_sequence = ordered_transactions.sequence_number
FROM ordered_transactions
WHERE transactions.id = ordered_transactions.id;

SELECT setval(
  'public.transactions_import_sequence_seq',
  COALESCE(MAX(import_sequence), 1),
  MAX(import_sequence) IS NOT NULL
)
FROM public.transactions;

ALTER TABLE public.transactions
  ALTER COLUMN import_sequence SET DEFAULT nextval('public.transactions_import_sequence_seq'),
  ALTER COLUMN import_sequence SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_import_sequence
  ON public.transactions (user_id, import_sequence);
