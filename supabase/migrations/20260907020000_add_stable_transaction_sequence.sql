-- Give every transaction an immutable insertion sequence.
-- Apply after 20260907010000_add_import_row_order.sql.

CREATE SEQUENCE IF NOT EXISTS public.transactions_import_sequence_seq;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS import_sequence BIGINT;

WITH ordered_transactions AS (
  SELECT id,
    row_number() OVER (ORDER BY created_at ASC, import_row_number ASC NULLS LAST, id ASC) AS sequence_number
  FROM public.transactions
  WHERE import_sequence IS NULL
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
