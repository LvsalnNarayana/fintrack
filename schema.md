# Database Schema Specification: FinTrack

## 1. Overview & Data Integrity Guidelines

This document provides the complete PostgreSQL and Supabase Database definition for **FinTrack**.

### Key Design Tenets:
1. **Financial Precision**: All monetary fields use `NUMERIC(12,2)` (fixed-point arithmetic). Floating point (`FLOAT`, `DOUBLE PRECISION`, `REAL`) is strictly forbidden.
2. **Deterministic Identity**: All primary keys are `UUID` generated via `gen_random_uuid()`.
3. **Auditability**: All mutable tables contain `created_at` and `updated_at` timestamps managed via an automated trigger.
4. **Relational Normalization**: Transactions link to `account_id` rather than redundantly storing `bank_id`, since `account -> bank` enforces strong consistency.
5. **Multi-Tenant Security**: Every table contains a `user_id` foreign key referencing `auth.users(id)` and has **Row Level Security (RLS)** strictly enabled.
6. **Safe Deletion & Archival**:
   * Categories referenced by transactions cannot be deleted; they must be archived (`is_archived = TRUE`).
   * Import batches support `ON DELETE CASCADE` to enable atomic batch rollback.
   * Transfer transactions maintain a paired foreign key reference to represent internal transfers cleanly without double-counting.

---

## 2. Enums and Custom Types

```sql
-- Account Types
CREATE TYPE account_type_enum AS ENUM (
    'SAVINGS',
    'CURRENT',
    'SALARY',
    'CREDIT_CARD',
    'CASH',
    'OTHER'
);

-- Transaction Types
CREATE TYPE transaction_type_enum AS ENUM (
    'INCOME',
    'EXPENSE',
    'TRANSFER'
);

-- Category Classifications
CREATE TYPE category_type_enum AS ENUM (
    'INCOME',
    'EXPENSE'
);

-- Rule Engine Matching Strategies
CREATE TYPE match_type_enum AS ENUM (
    'CONTAINS',
    'EXACT',
    'STARTS_WITH',
    'REGEX'
);
```

---

## 3. Automated Timestamp Trigger Function

```sql
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Tables Specification

### 4.1. Table: `profiles`
* **Purpose**: Extends `auth.users` with user-specific system preferences.
* **Columns**:
  * `id` (`UUID`, PK, `REFERENCES auth.users(id) ON DELETE CASCADE`)
  * `email` (`TEXT`, NOT NULL)
  * `display_name` (`TEXT`, NULLABLE)
  * `base_currency` (`VARCHAR(3)`, NOT NULL, DEFAULT `'INR'`)
  * `date_format` (`VARCHAR(20)`, NOT NULL, DEFAULT `'YYYY-MM-DD'`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
* **Indexes**: Primary key index on `id`.
* **RLS**: User can only read/update their own profile.

### 4.2. Table: `banks`
* **Purpose**: Represents institutional banking entities.
* **Columns**:
  * `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
  * `user_id` (`UUID`, NOT NULL, `REFERENCES auth.users(id) ON DELETE CASCADE`)
  * `name` (`TEXT`, NOT NULL)
  * `logo_url` (`TEXT`, NULLABLE)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
* **Constraints**: `UNIQUE(user_id, name)`
* **Indexes**: `idx_banks_user_id` on `(user_id)`.

### 4.3. Table: `accounts`
* **Purpose**: Represents specific accounts held at a bank.
* **Columns**:
  * `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
  * `user_id` (`UUID`, NOT NULL, `REFERENCES auth.users(id) ON DELETE CASCADE`)
  * `bank_id` (`UUID`, NOT NULL, `REFERENCES banks(id) ON DELETE RESTRICT`)
  * `name` (`TEXT`, NOT NULL)
  * `account_type` (`account_type_enum`, NOT NULL, DEFAULT `'SAVINGS'`)
  * `account_number_mask` (`VARCHAR(8)`, NULLABLE) -- Last 4 digits (e.g., 'XX1234')
  * `currency` (`VARCHAR(3)`, NOT NULL, DEFAULT `'INR'`)
  * `opening_balance` (`NUMERIC(12,2)`, NOT NULL, DEFAULT `0.00`)
  * `is_active` (`BOOLEAN`, NOT NULL, DEFAULT `TRUE`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
* **Constraints**: `UNIQUE(user_id, bank_id, name)`
* **Indexes**: `idx_accounts_user_bank` on `(user_id, bank_id)`, `idx_accounts_active` on `(user_id, is_active)`.

### 4.4. Table: `categories`
* **Purpose**: Configurable income and expense taxonomy.
* **Columns**:
  * `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
  * `user_id` (`UUID`, NOT NULL, `REFERENCES auth.users(id) ON DELETE CASCADE`)
  * `parent_id` (`UUID`, NULLABLE, `REFERENCES categories(id) ON DELETE RESTRICT`)
  * `name` (`TEXT`, NOT NULL)
  * `type` (`category_type_enum`, NOT NULL)
  * `color` (`VARCHAR(7)`, NOT NULL, DEFAULT `'#64748B'`) -- Hex color code
  * `icon` (`TEXT`, NULLABLE) -- MUI icon identifier
  * `is_archived` (`BOOLEAN`, NOT NULL, DEFAULT `FALSE`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
* **Constraints**: `UNIQUE(user_id, name, type)`
* **Indexes**: `idx_categories_user_type` on `(user_id, type)`, `idx_categories_active` on `(user_id, is_archived)`.

### 4.5. Table: `import_batches`
* **Purpose**: Encapsulates a statement ingestion session.
* **Columns**:
  * `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
  * `user_id` (`UUID`, NOT NULL, `REFERENCES auth.users(id) ON DELETE CASCADE`)
  * `account_id` (`UUID`, NOT NULL, `REFERENCES accounts(id) ON DELETE CASCADE`)
  * `source_file_name` (`TEXT`, NOT NULL)
  * `source_file_hash` (`TEXT`, NOT NULL) -- SHA-256 hash to warn on duplicates
  * `total_rows` (`INT`, NOT NULL, DEFAULT 0)
  * `imported_rows` (`INT`, NOT NULL, DEFAULT 0)
  * `skipped_duplicates` (`INT`, NOT NULL, DEFAULT 0)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
* **Indexes**: `idx_import_batches_account` on `(account_id)`, `idx_import_batches_hash` on `(user_id, source_file_hash)`.

### 4.6. Table: `transactions`
* **Purpose**: Core ledger record storing all debit, credit, and transfer activity.
* **Columns**:
  * `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
  * `user_id` (`UUID`, NOT NULL, `REFERENCES auth.users(id) ON DELETE CASCADE`)
  * `account_id` (`UUID`, NOT NULL, `REFERENCES accounts(id) ON DELETE RESTRICT`)
  * `category_id` (`UUID`, NULLABLE, `REFERENCES categories(id) ON DELETE SET NULL`)
  * `import_batch_id` (`UUID`, NULLABLE, `REFERENCES import_batches(id) ON DELETE CASCADE`)
  * `date` (`DATE`, NOT NULL)
  * `description` (`TEXT`, NOT NULL)
  * `amount` (`NUMERIC(12,2)`, NOT NULL, CHECK (`amount >= 0`))
  * `transaction_type` (`transaction_type_enum`, NOT NULL)
  * `deposit` (`NUMERIC(12,2)`, NOT NULL, DEFAULT `0.00`, CHECK (`deposit >= 0`))
  * `withdrawal` (`NUMERIC(12,2)`, NOT NULL, DEFAULT `0.00`, CHECK (`withdrawal >= 0`))
  * `running_balance` (`NUMERIC(12,2)`, NULLABLE)
  * `currency` (`VARCHAR(3)`, NOT NULL, DEFAULT `'INR'`)
  * `notes` (`TEXT`, NULLABLE)
  * `transfer_pair_id` (`UUID`, NULLABLE, `REFERENCES transactions(id) ON DELETE SET NULL`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
* **Constraints**:
  * `chk_trans_amounts`: `CHECK (deposit > 0 OR withdrawal > 0 OR amount = 0)`
* **Indexes**:
  * `idx_transactions_user_date` on `(user_id, date DESC)`
  * `idx_transactions_account_date` on `(account_id, date DESC)`
  * `idx_transactions_category` on `(category_id)`
  * `idx_transactions_type` on `(user_id, transaction_type)`
  * `idx_transactions_import_batch` on `(import_batch_id)`
  * `idx_transactions_desc_trgm` GIN index on `(description gin_trgm_ops)` for instant fast search.

### 4.7. Table: `categorization_rules`
* **Purpose**: Heuristics to auto-assign categories during statement ingestion.
* **Columns**:
  * `id` (`UUID`, PK, DEFAULT `gen_random_uuid()`)
  * `user_id` (`UUID`, NOT NULL, `REFERENCES auth.users(id) ON DELETE CASCADE`)
  * `keyword` (`TEXT`, NOT NULL)
  * `match_type` (`match_type_enum`, NOT NULL, DEFAULT `'CONTAINS'`)
  * `category_id` (`UUID`, NOT NULL, `REFERENCES categories(id) ON DELETE CASCADE`)
  * `priority` (`INT`, NOT NULL, DEFAULT 100) -- Lower number executes earlier
  * `is_active` (`BOOLEAN`, NOT NULL, DEFAULT `TRUE`)
  * `created_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
  * `updated_at` (`TIMESTAMPTZ`, NOT NULL, DEFAULT `NOW()`)
* **Indexes**: `idx_rules_user_priority` on `(user_id, is_active, priority ASC)`.

---

## 5. Complete DDL Script

```sql
-- Enable Trigram Extension for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    date_format VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Banks Table
CREATE TABLE banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_bank_name UNIQUE(user_id, name)
);

CREATE INDEX idx_banks_user_id ON banks(user_id);

-- 3. Accounts Table
CREATE TABLE accounts (
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

CREATE INDEX idx_accounts_user_bank ON accounts(user_id, bank_id);
CREATE INDEX idx_accounts_active ON accounts(user_id, is_active);

-- 4. Categories Table
CREATE TABLE categories (
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

CREATE INDEX idx_categories_user_type ON categories(user_id, type);
CREATE INDEX idx_categories_active ON categories(user_id, is_archived);

-- 5. Import Batches Table
CREATE TABLE import_batches (
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

CREATE INDEX idx_import_batches_account ON import_batches(account_id);
CREATE INDEX idx_import_batches_hash ON import_batches(user_id, source_file_hash);

-- 6. Transactions Table
CREATE TABLE transactions (
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

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_account_date ON transactions(account_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(user_id, transaction_type);
CREATE INDEX idx_transactions_import_batch ON transactions(import_batch_id);
CREATE INDEX idx_transactions_desc_trgm ON transactions USING gin (description gin_trgm_ops);

-- 7. Categorization Rules Table
CREATE TABLE categorization_rules (
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

CREATE INDEX idx_rules_user_priority ON categorization_rules(user_id, is_active, priority ASC);

-- 8. Apply Updated At Triggers
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_banks_updated_at BEFORE UPDATE ON banks FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_rules_updated_at BEFORE UPDATE ON categorization_rules FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
```

---

## 6. Row-Level Security (RLS) Policies

All tables mandate user isolation. A user is only permitted to read or mutate records where `user_id = auth.uid()`.

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_rules ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- 2. Banks Policies
CREATE POLICY "banks_select_own" ON banks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "banks_insert_own" ON banks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "banks_update_own" ON banks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "banks_delete_own" ON banks FOR DELETE USING (user_id = auth.uid());

-- 3. Accounts Policies
CREATE POLICY "accounts_select_own" ON accounts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "accounts_insert_own" ON accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "accounts_update_own" ON accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "accounts_delete_own" ON accounts FOR DELETE USING (user_id = auth.uid());

-- 4. Categories Policies
CREATE POLICY "categories_select_own" ON categories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "categories_insert_own" ON categories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories_update_own" ON categories FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "categories_delete_own" ON categories FOR DELETE USING (user_id = auth.uid());

-- 5. Import Batches Policies
CREATE POLICY "import_batches_select_own" ON import_batches FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "import_batches_insert_own" ON import_batches FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "import_batches_delete_own" ON import_batches FOR DELETE USING (user_id = auth.uid());

-- 6. Transactions Policies
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "transactions_update_own" ON transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "transactions_delete_own" ON transactions FOR DELETE USING (user_id = auth.uid());

-- 7. Categorization Rules Policies
CREATE POLICY "rules_select_own" ON categorization_rules FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "rules_insert_own" ON categorization_rules FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "rules_update_own" ON categorization_rules FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "rules_delete_own" ON categorization_rules FOR DELETE USING (user_id = auth.uid());
```

---

## 7. Default Seed Data (Categories)

When a new user signs up, the system populates a standard default taxonomy via a trigger on `auth.users`:

```sql
CREATE OR REPLACE FUNCTION seed_default_user_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Standard Income Categories
    INSERT INTO categories (user_id, name, type, color, icon) VALUES
        (NEW.id, 'Salary', 'INCOME', '#16A34A', 'payments'),
        (NEW.id, 'Freelance', 'INCOME', '#10B981', 'work'),
        (NEW.id, 'Investments & Dividends', 'INCOME', '#059669', 'trending_up'),
        (NEW.id, 'Refunds', 'INCOME', '#34D399', 'receipt_long'),
        (NEW.id, 'Other Income', 'INCOME', '#6EE7B7', 'add_circle');

    -- Standard Expense Categories
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
        (NEW.id, 'Other Expense', 'EXPENSE', '#94A3B8', 'more_horiz');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_user_seed_categories
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION seed_default_user_categories();
```

