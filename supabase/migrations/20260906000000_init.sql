-- ============================================================================
-- FinTrack Initial PostgreSQL Schema & RLS Policies (Hosted Supabase)
-- ============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Custom Enumerations
DO $$ BEGIN
    CREATE TYPE account_type_enum AS ENUM ('SAVINGS', 'CURRENT', 'SALARY', 'CREDIT_CARD', 'CASH', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type_enum AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE category_type_enum AS ENUM ('INCOME', 'EXPENSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE match_type_enum AS ENUM ('CONTAINS', 'EXACT', 'STARTS_WITH', 'REGEX');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Trigger Function: Update timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Tables Definitions

-- 4.1 Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    date_format VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Banks Table
CREATE TABLE IF NOT EXISTS banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_bank_name UNIQUE(user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_banks_user_id ON banks(user_id);

-- 4.3 Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    account_type account_type_enum NOT NULL DEFAULT 'SAVINGS',
    account_number_mask VARCHAR(8),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_bank_account UNIQUE(user_id, bank_id, name)
);
CREATE INDEX IF NOT EXISTS idx_accounts_user_bank ON accounts(user_id, bank_id);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(user_id, is_active);

-- 4.4 Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    type category_type_enum NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#64748B',
    icon TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_category_name_type UNIQUE(user_id, name, type)
);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(user_id, is_archived);

-- 4.5 Import Batches Table
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    source_file_name TEXT NOT NULL,
    source_file_hash TEXT NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    imported_rows INT NOT NULL DEFAULT 0,
    skipped_duplicates INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_import_batches_account ON import_batches(account_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_hash ON import_batches(user_id, source_file_hash);

-- 4.6 Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    import_batch_id UUID REFERENCES import_batches(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    transaction_type transaction_type_enum NOT NULL,
    deposit NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (deposit >= 0),
    withdrawal NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (withdrawal >= 0),
    running_balance NUMERIC(12,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    notes TEXT,
    transfer_pair_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trans_amounts CHECK (deposit > 0 OR withdrawal > 0 OR amount = 0)
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(user_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_import_batch ON transactions(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_transactions_desc_trgm ON transactions USING gin (description gin_trgm_ops);

-- 4.7 Categorization Rules Table
CREATE TABLE IF NOT EXISTS categorization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    match_type match_type_enum NOT NULL DEFAULT 'CONTAINS',
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    priority INT NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rules_user_priority ON categorization_rules(user_id, is_active, priority ASC);

-- 5. Updated At Triggers
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_banks_updated_at ON banks;
CREATE TRIGGER trg_banks_updated_at BEFORE UPDATE ON banks FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON accounts;
CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_rules_updated_at ON categorization_rules;
CREATE TRIGGER trg_rules_updated_at BEFORE UPDATE ON categorization_rules FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
    CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
    DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
    CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
    DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
    CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
END $$;

-- Banks Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "banks_select_own" ON banks;
    CREATE POLICY "banks_select_own" ON banks FOR SELECT USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "banks_insert_own" ON banks;
    CREATE POLICY "banks_insert_own" ON banks FOR INSERT WITH CHECK (user_id = auth.uid());
    DROP POLICY IF EXISTS "banks_update_own" ON banks;
    CREATE POLICY "banks_update_own" ON banks FOR UPDATE USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "banks_delete_own" ON banks;
    CREATE POLICY "banks_delete_own" ON banks FOR DELETE USING (user_id = auth.uid());
END $$;

-- Accounts Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "accounts_select_own" ON accounts;
    CREATE POLICY "accounts_select_own" ON accounts FOR SELECT USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "accounts_insert_own" ON accounts;
    CREATE POLICY "accounts_insert_own" ON accounts FOR INSERT WITH CHECK (user_id = auth.uid());
    DROP POLICY IF EXISTS "accounts_update_own" ON accounts;
    CREATE POLICY "accounts_update_own" ON accounts FOR UPDATE USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "accounts_delete_own" ON accounts;
    CREATE POLICY "accounts_delete_own" ON accounts FOR DELETE USING (user_id = auth.uid());
END $$;

-- Categories Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "categories_select_own" ON categories;
    CREATE POLICY "categories_select_own" ON categories FOR SELECT USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "categories_insert_own" ON categories;
    CREATE POLICY "categories_insert_own" ON categories FOR INSERT WITH CHECK (user_id = auth.uid());
    DROP POLICY IF EXISTS "categories_update_own" ON categories;
    CREATE POLICY "categories_update_own" ON categories FOR UPDATE USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "categories_delete_own" ON categories;
    CREATE POLICY "categories_delete_own" ON categories FOR DELETE USING (user_id = auth.uid());
END $$;

-- Import Batches Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "import_batches_select_own" ON import_batches;
    CREATE POLICY "import_batches_select_own" ON import_batches FOR SELECT USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "import_batches_insert_own" ON import_batches;
    CREATE POLICY "import_batches_insert_own" ON import_batches FOR INSERT WITH CHECK (user_id = auth.uid());
    DROP POLICY IF EXISTS "import_batches_delete_own" ON import_batches;
    CREATE POLICY "import_batches_delete_own" ON import_batches FOR DELETE USING (user_id = auth.uid());
END $$;

-- Transactions Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
    CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
    CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
    DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
    CREATE POLICY "transactions_update_own" ON transactions FOR UPDATE USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "transactions_delete_own" ON transactions;
    CREATE POLICY "transactions_delete_own" ON transactions FOR DELETE USING (user_id = auth.uid());
END $$;

-- Categorization Rules Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "rules_select_own" ON categorization_rules;
    CREATE POLICY "rules_select_own" ON categorization_rules FOR SELECT USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "rules_insert_own" ON categorization_rules;
    CREATE POLICY "rules_insert_own" ON categorization_rules FOR INSERT WITH CHECK (user_id = auth.uid());
    DROP POLICY IF EXISTS "rules_update_own" ON categorization_rules;
    CREATE POLICY "rules_update_own" ON categorization_rules FOR UPDATE USING (user_id = auth.uid());
    DROP POLICY IF EXISTS "rules_delete_own" ON categorization_rules;
    CREATE POLICY "rules_delete_own" ON categorization_rules FOR DELETE USING (user_id = auth.uid());
END $$;

-- 7. Automated Seed Categories Trigger for New Users
CREATE OR REPLACE FUNCTION seed_default_user_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Seed Income Categories
    INSERT INTO categories (user_id, name, type, color, icon) VALUES
        (NEW.id, 'Salary', 'INCOME', '#16A34A', 'payments'),
        (NEW.id, 'Freelance', 'INCOME', '#10B981', 'work'),
        (NEW.id, 'Investments & Dividends', 'INCOME', '#059669', 'trending_up'),
        (NEW.id, 'Refunds', 'INCOME', '#34D399', 'receipt_long'),
        (NEW.id, 'Other Income', 'INCOME', '#6EE7B7', 'add_circle')
    ON CONFLICT DO NOTHING;

    -- Seed Expense Categories
    INSERT INTO categories (user_id, name, type, color, icon) VALUES
        (NEW.id, 'Food & Dining', 'EXPENSE', '#EF4444', 'restaurant'),
        (NEW.id, 'Groceries', 'EXPENSE', '#F97316', 'local_grocery_store'),
        (NEW.id, 'Shopping', 'EXPENSE', '#F59E0B', 'shopping_bag'),
        (NEW.id, 'Transportation & Fuel', 'EXPENSE', '#3B82F6', 'directions_car'),
        (NEW.id, 'Bills & Utilities', 'EXPENSE', '#6366F1', 'receipt'),
        (NEW.id, 'Rent & Housing', 'EXPENSE', '#8B5CF6', 'home'),
        (NEW.id, 'Healthcare & Medical', 'EXPENSE', '#EC4899', 'medical_services'),
        (NEW.id, 'Entertainment & Leisure', 'EXPENSE', '#14B8A6', 'movie'),
        (NEW.id, 'Travel', 'EXPENSE', '#06B6D4', 'flight'),
        (NEW.id, 'Education', 'EXPENSE', '#84CC16', 'school'),
        (NEW.id, 'Subscriptions', 'EXPENSE', '#A855F7', 'subscriptions'),
        (NEW.id, 'Investments Outflow', 'EXPENSE', '#64748B', 'savings'),
        (NEW.id, 'Other Expense', 'EXPENSE', '#94A3B8', 'more_horiz')
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatically create profile and seed categories upon auth.users signup
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, display_name)
    VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1))
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

DROP TRIGGER IF EXISTS trg_user_seed_categories ON profiles;
CREATE TRIGGER trg_user_seed_categories
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION seed_default_user_categories();

-- 8. Analytics Procedures (RPCs)

-- 8.1 Dashboard Summary
CREATE OR REPLACE FUNCTION get_dashboard_summary(
    p_start_date DATE,
    p_end_date DATE,
    p_account_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_income NUMERIC(12,2);
    v_expense NUMERIC(12,2);
    v_net_flow NUMERIC(12,2);
    v_current_balance NUMERIC(12,2);
BEGIN
    -- 1. Total Income
    SELECT COALESCE(SUM(amount), 0.00) INTO v_income
    FROM transactions
    WHERE user_id = v_user_id
      AND transaction_type = 'INCOME'
      AND date BETWEEN p_start_date AND p_end_date
      AND (p_account_id IS NULL OR account_id = p_account_id);

    -- 2. Total Expense
    SELECT COALESCE(SUM(amount), 0.00) INTO v_expense
    FROM transactions
    WHERE user_id = v_user_id
      AND transaction_type = 'EXPENSE'
      AND date BETWEEN p_start_date AND p_end_date
      AND (p_account_id IS NULL OR account_id = p_account_id);

    -- 3. Net Cash Flow
    v_net_flow := v_income - v_expense;

    -- 4. Current Balance (Latest running balance recorded)
    SELECT COALESCE(running_balance, 0.00) INTO v_current_balance
    FROM transactions
    WHERE user_id = v_user_id
      AND running_balance IS NOT NULL
      AND (p_account_id IS NULL OR account_id = p_account_id)
    ORDER BY date DESC, created_at DESC
    LIMIT 1;

    RETURN json_build_object(
        'income', v_income,
        'expense', v_expense,
        'net_flow', v_net_flow,
        'current_balance', COALESCE(v_current_balance, 0.00)
    );
END;
$$;

-- 8.2 Category Spending
CREATE OR REPLACE FUNCTION get_category_spending(
    p_start_date DATE,
    p_end_date DATE,
    p_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_color TEXT,
    total_amount NUMERIC(12,2),
    transaction_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        c.id AS category_id,
        COALESCE(c.name, 'Uncategorized') AS category_name,
        COALESCE(c.color, '#94A3B8') AS category_color,
        SUM(t.amount) AS total_amount,
        COUNT(t.id) AS transaction_count
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = auth.uid()
      AND t.transaction_type = 'EXPENSE'
      AND t.date BETWEEN p_start_date AND p_end_date
      AND (p_account_id IS NULL OR t.account_id = p_account_id)
    GROUP BY c.id, c.name, c.color
    ORDER BY total_amount DESC;
$$;

-- 8.3 Monthly Cash Flow for a Year
CREATE OR REPLACE FUNCTION get_monthly_cash_flow(
    p_year INT,
    p_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
    month_num INT,
    month_name TEXT,
    total_income NUMERIC(12,2),
    total_expense NUMERIC(12,2),
    net_savings NUMERIC(12,2)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH months AS (
        SELECT generate_series(1, 12) AS m
    ),
    monthly_data AS (
        SELECT 
            EXTRACT(MONTH FROM date)::INT AS m,
            COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END), 0.00) AS income,
            COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0.00) AS expense
        FROM transactions
        WHERE user_id = auth.uid()
          AND EXTRACT(YEAR FROM date) = p_year
          AND (p_account_id IS NULL OR account_id = p_account_id)
        GROUP BY EXTRACT(MONTH FROM date)
    )
    SELECT 
        months.m AS month_num,
        to_char(to_date(months.m::text, 'MM'), 'Mon') AS month_name,
        COALESCE(monthly_data.income, 0.00) AS total_income,
        COALESCE(monthly_data.expense, 0.00) AS total_expense,
        (COALESCE(monthly_data.income, 0.00) - COALESCE(monthly_data.expense, 0.00)) AS net_savings
    FROM months
    LEFT JOIN monthly_data ON months.m = monthly_data.m
    ORDER BY months.m ASC;
$$;

-- 8.4 Top Merchants
CREATE OR REPLACE FUNCTION get_top_merchants(
    p_start_date DATE,
    p_end_date DATE,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    merchant_name TEXT,
    total_spent NUMERIC(12,2),
    transaction_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        description AS merchant_name,
        SUM(amount) AS total_spent,
        COUNT(id) AS transaction_count
    FROM transactions
    WHERE user_id = auth.uid()
      AND transaction_type = 'EXPENSE'
      AND date BETWEEN p_start_date AND p_end_date
    GROUP BY description
    ORDER BY total_spent DESC
    LIMIT p_limit;
$$;

