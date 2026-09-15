-- FinTrack consolidated Supabase schema.
-- Run this one file for a new project or an existing project.
-- Safe to rerun: tables, columns, indexes, functions, and policies use idempotent operations.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN CREATE TYPE account_type_enum AS ENUM ('SAVINGS','CURRENT','SALARY','CREDIT_CARD','CASH','OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE transaction_type_enum AS ENUM ('INCOME','EXPENSE','TRANSFER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE category_type_enum AS ENUM ('INCOME','EXPENSE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE match_type_enum AS ENUM ('CONTAINS','EXACT','STARTS_WITH','REGEX'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  date_format VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, logo_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_bank_name UNIQUE(user_id, name)
);
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE RESTRICT, name TEXT NOT NULL,
  account_type account_type_enum NOT NULL DEFAULT 'SAVINGS', account_number_mask VARCHAR(8), currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_bank_account UNIQUE(user_id, bank_id, name)
);
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT, name TEXT NOT NULL, type category_type_enum NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#64748B', icon TEXT, is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_category_name_type UNIQUE(user_id, name, type)
);
CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, source_file_name TEXT NOT NULL, source_file_hash TEXT NOT NULL,
  total_rows INT NOT NULL DEFAULT 0, imported_rows INT NOT NULL DEFAULT 0, skipped_duplicates INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT, category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  import_batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE, date DATE NOT NULL, description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0), transaction_type transaction_type_enum NOT NULL,
  deposit NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (deposit >= 0), withdrawal NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (withdrawal >= 0),
  running_balance NUMERIC(12,2), currency VARCHAR(3) NOT NULL DEFAULT 'INR', notes TEXT,
  transfer_pair_id UUID REFERENCES transactions(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT chk_trans_amounts CHECK (deposit > 0 OR withdrawal > 0 OR amount = 0)
);
CREATE TABLE IF NOT EXISTS public.categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL, match_type match_type_enum NOT NULL DEFAULT 'CONTAINS', category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  priority INT NOT NULL DEFAULT 100, is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS import_row_number INTEGER;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS import_sequence BIGINT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS order_date DATE;

UPDATE public.profiles SET username = lower(split_part(email, '@', 1)) WHERE username IS NULL;
UPDATE public.transactions SET order_date = date WHERE order_date IS NULL;

CREATE SEQUENCE IF NOT EXISTS public.transactions_import_sequence_seq;
DROP INDEX IF EXISTS public.uq_transactions_import_sequence;
WITH ordered_transactions AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC, import_batch_id ASC NULLS FIRST, import_row_number ASC NULLS LAST, id ASC) AS sequence_number
  FROM public.transactions
)
UPDATE public.transactions t SET import_sequence = o.sequence_number FROM ordered_transactions o WHERE t.id = o.id;
SELECT setval('public.transactions_import_sequence_seq', COALESCE(MAX(import_sequence), 1), MAX(import_sequence) IS NOT NULL) FROM public.transactions;
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN order_date SET DEFAULT CURRENT_DATE, ALTER COLUMN order_date SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN import_sequence SET DEFAULT nextval('public.transactions_import_sequence_seq'), ALTER COLUMN import_sequence SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_username ON public.profiles(username);
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_import_sequence ON public.transactions(user_id, import_sequence);
CREATE INDEX IF NOT EXISTS idx_banks_user_id ON public.banks(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_bank ON public.accounts(user_id, bank_id);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON public.accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON public.categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_import_batches_account ON public.import_batches(account_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_hash ON public.import_batches(user_id, source_file_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON public.transactions(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(user_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_import_batch ON public.transactions(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_import_order ON public.transactions(user_id, created_at, import_row_number);
CREATE INDEX IF NOT EXISTS idx_transactions_order_date ON public.transactions(user_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_rules_user_priority ON public.categorization_rules(user_id, is_active, priority ASC);
CREATE INDEX IF NOT EXISTS idx_transactions_desc_trgm ON public.transactions USING gin (description gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.update_timestamp_column() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();
DROP TRIGGER IF EXISTS trg_banks_updated_at ON public.banks;
CREATE TRIGGER trg_banks_updated_at BEFORE UPDATE ON public.banks FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();
DROP TRIGGER IF EXISTS trg_accounts_updated_at ON public.accounts;
CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();
DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();
DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();
DROP TRIGGER IF EXISTS trg_rules_updated_at ON public.categorization_rules;
CREATE TRIGGER trg_rules_updated_at BEFORE UPDATE ON public.categorization_rules FOR EACH ROW EXECUTE FUNCTION public.update_timestamp_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorization_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS profiles_select_own ON public.profiles; CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (id = auth.uid());
  DROP POLICY IF EXISTS profiles_insert_own ON public.profiles; CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
  DROP POLICY IF EXISTS profiles_update_own ON public.profiles; CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (id = auth.uid());
  DROP POLICY IF EXISTS banks_select_own ON public.banks; CREATE POLICY banks_select_own ON public.banks FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS banks_insert_own ON public.banks; CREATE POLICY banks_insert_own ON public.banks FOR INSERT WITH CHECK (user_id = auth.uid());
  DROP POLICY IF EXISTS banks_update_own ON public.banks; CREATE POLICY banks_update_own ON public.banks FOR UPDATE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS banks_delete_own ON public.banks; CREATE POLICY banks_delete_own ON public.banks FOR DELETE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS accounts_select_own ON public.accounts; CREATE POLICY accounts_select_own ON public.accounts FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS accounts_insert_own ON public.accounts; CREATE POLICY accounts_insert_own ON public.accounts FOR INSERT WITH CHECK (user_id = auth.uid());
  DROP POLICY IF EXISTS accounts_update_own ON public.accounts; CREATE POLICY accounts_update_own ON public.accounts FOR UPDATE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS accounts_delete_own ON public.accounts; CREATE POLICY accounts_delete_own ON public.accounts FOR DELETE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS categories_select_own ON public.categories; CREATE POLICY categories_select_own ON public.categories FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS categories_insert_own ON public.categories; CREATE POLICY categories_insert_own ON public.categories FOR INSERT WITH CHECK (user_id = auth.uid());
  DROP POLICY IF EXISTS categories_update_own ON public.categories; CREATE POLICY categories_update_own ON public.categories FOR UPDATE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS categories_delete_own ON public.categories; CREATE POLICY categories_delete_own ON public.categories FOR DELETE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS import_batches_select_own ON public.import_batches; CREATE POLICY import_batches_select_own ON public.import_batches FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS import_batches_insert_own ON public.import_batches; CREATE POLICY import_batches_insert_own ON public.import_batches FOR INSERT WITH CHECK (user_id = auth.uid());
  DROP POLICY IF EXISTS import_batches_delete_own ON public.import_batches; CREATE POLICY import_batches_delete_own ON public.import_batches FOR DELETE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS transactions_select_own ON public.transactions; CREATE POLICY transactions_select_own ON public.transactions FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS transactions_insert_own ON public.transactions; CREATE POLICY transactions_insert_own ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid());
  DROP POLICY IF EXISTS transactions_update_own ON public.transactions; CREATE POLICY transactions_update_own ON public.transactions FOR UPDATE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS transactions_delete_own ON public.transactions; CREATE POLICY transactions_delete_own ON public.transactions FOR DELETE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS rules_select_own ON public.categorization_rules; CREATE POLICY rules_select_own ON public.categorization_rules FOR SELECT USING (user_id = auth.uid());
  DROP POLICY IF EXISTS rules_insert_own ON public.categorization_rules; CREATE POLICY rules_insert_own ON public.categorization_rules FOR INSERT WITH CHECK (user_id = auth.uid());
  DROP POLICY IF EXISTS rules_update_own ON public.categorization_rules; CREATE POLICY rules_update_own ON public.categorization_rules FOR UPDATE USING (user_id = auth.uid());
  DROP POLICY IF EXISTS rules_delete_own ON public.categorization_rules; CREATE POLICY rules_delete_own ON public.categorization_rules FOR DELETE USING (user_id = auth.uid());
END $$;

CREATE OR REPLACE FUNCTION public.seed_default_user_categories() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.categories(user_id,name,type,color,icon) VALUES
  (NEW.id,'Salary','INCOME','#16A34A','payments'),(NEW.id,'Freelance','INCOME','#10B981','work'),(NEW.id,'Investments & Dividends','INCOME','#059669','trending_up'),(NEW.id,'Refunds','INCOME','#34D399','receipt_long'),(NEW.id,'Other Income','INCOME','#6EE7B7','add_circle'),
  (NEW.id,'Food & Dining','EXPENSE','#EF4444','restaurant'),(NEW.id,'Groceries','EXPENSE','#F97316','local_grocery_store'),(NEW.id,'Shopping','EXPENSE','#F59E0B','shopping_bag'),(NEW.id,'Transportation & Fuel','EXPENSE','#3B82F6','directions_car'),(NEW.id,'Bills & Utilities','EXPENSE','#6366F1','receipt'),(NEW.id,'Rent & Housing','EXPENSE','#8B5CF6','home'),(NEW.id,'Healthcare & Medical','EXPENSE','#EC4899','medical_services'),(NEW.id,'Entertainment & Leisure','EXPENSE','#14B8A6','movie'),(NEW.id,'Travel','EXPENSE','#06B6D4','flight'),(NEW.id,'Education','EXPENSE','#84CC16','school'),(NEW.id,'Subscriptions','EXPENSE','#A855F7','subscriptions'),(NEW.id,'Investments Outflow','EXPENSE','#64748B','savings'),(NEW.id,'Other Expense','EXPENSE','#94A3B8','more_horiz')
  ON CONFLICT (user_id,name,type) DO NOTHING; RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id,email,username,display_name) VALUES (NEW.id,NEW.email,lower(COALESCE(NEW.raw_user_meta_data->>'username',split_part(COALESCE(NEW.email,''),'@',1))),split_part(COALESCE(NEW.email,''),'@',1)) ON CONFLICT(id) DO NOTHING; RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
DROP TRIGGER IF EXISTS trg_user_seed_categories ON public.profiles;
CREATE TRIGGER trg_user_seed_categories AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.seed_default_user_categories();

-- Analytics RPCs
CREATE OR REPLACE FUNCTION public.get_dashboard_summary(p_start_date DATE,p_end_date DATE,p_account_id UUID DEFAULT NULL) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id UUID:=auth.uid(); v_income NUMERIC(12,2); v_expense NUMERIC(12,2); v_current_balance NUMERIC(12,2); BEGIN
SELECT COALESCE(SUM(amount),0) INTO v_income FROM public.transactions WHERE user_id=v_user_id AND transaction_type='INCOME' AND date BETWEEN p_start_date AND p_end_date AND (p_account_id IS NULL OR account_id=p_account_id);
SELECT COALESCE(SUM(amount),0) INTO v_expense FROM public.transactions WHERE user_id=v_user_id AND transaction_type='EXPENSE' AND date BETWEEN p_start_date AND p_end_date AND (p_account_id IS NULL OR account_id=p_account_id);
SELECT COALESCE(running_balance,0) INTO v_current_balance FROM public.transactions WHERE user_id=v_user_id AND running_balance IS NOT NULL AND (p_account_id IS NULL OR account_id=p_account_id) ORDER BY date DESC,created_at DESC LIMIT 1;
RETURN json_build_object('income',v_income,'expense',v_expense,'net_flow',v_income-v_expense,'current_balance',COALESCE(v_current_balance,0)); END; $$;
CREATE OR REPLACE FUNCTION public.get_category_spending(p_start_date DATE,p_end_date DATE,p_account_id UUID DEFAULT NULL) RETURNS TABLE(category_id UUID,category_name TEXT,category_color TEXT,total_amount NUMERIC(12,2),transaction_count BIGINT) LANGUAGE sql SECURITY DEFINER AS $$ SELECT c.id,COALESCE(c.name,'Uncategorized'),COALESCE(c.color,'#94A3B8'),SUM(t.amount),COUNT(t.id) FROM public.transactions t LEFT JOIN public.categories c ON t.category_id=c.id WHERE t.user_id=auth.uid() AND t.transaction_type='EXPENSE' AND t.date BETWEEN p_start_date AND p_end_date AND (p_account_id IS NULL OR t.account_id=p_account_id) GROUP BY c.id,c.name,c.color ORDER BY total_amount DESC; $$;
CREATE OR REPLACE FUNCTION public.get_monthly_cash_flow(p_year INT,p_account_id UUID DEFAULT NULL) RETURNS TABLE(month_num INT,month_name TEXT,total_income NUMERIC(12,2),total_expense NUMERIC(12,2),net_savings NUMERIC(12,2)) LANGUAGE sql SECURITY DEFINER AS $$ WITH months AS (SELECT generate_series(1,12) AS m), d AS (SELECT EXTRACT(MONTH FROM date)::INT AS m,COALESCE(SUM(CASE WHEN transaction_type='INCOME' THEN amount ELSE 0 END),0) income,COALESCE(SUM(CASE WHEN transaction_type='EXPENSE' THEN amount ELSE 0 END),0) expense FROM public.transactions WHERE user_id=auth.uid() AND EXTRACT(YEAR FROM date)=p_year AND (p_account_id IS NULL OR account_id=p_account_id) GROUP BY 1) SELECT months.m,to_char(to_date(months.m::text,'MM'),'Mon'),COALESCE(d.income,0),COALESCE(d.expense,0),COALESCE(d.income,0)-COALESCE(d.expense,0) FROM months LEFT JOIN d ON months.m=d.m ORDER BY months.m; $$;
CREATE OR REPLACE FUNCTION public.get_top_merchants(p_start_date DATE,p_end_date DATE,p_limit INT DEFAULT 10) RETURNS TABLE(merchant_name TEXT,total_spent NUMERIC(12,2),transaction_count BIGINT) LANGUAGE sql SECURITY DEFINER AS $$ SELECT description,SUM(amount),COUNT(id) FROM public.transactions WHERE user_id=auth.uid() AND transaction_type='EXPENSE' AND date BETWEEN p_start_date AND p_end_date GROUP BY description ORDER BY total_spent DESC LIMIT p_limit; $$;
