# Analytics & Aggregation Engine: FinTrack PWA

## 1. Analytics Architecture & Server-Side Computing

FinTrack adheres to a strict performance principle:
> **Never pull 10,000+ transaction rows into the React browser client to compute sums and groupings.**

All mathematical aggregations, groupings, time-series truncations, and percentages are executed directly within PostgreSQL using indexed database queries and Remote Procedure Calls (RPCs). The React frontend receives lightweight, pre-computed JSON arrays tailored for chart rendering.

```
┌────────────────────────────────────────────────────────┐
│                   React Client (UI)                    │
│   (Recharts Bar, Line, and Donut charts render JSON)   │
└───────────────────────────▲────────────────────────────┘
                            │ Lightweight JSON (< 5 KB)
┌───────────────────────────┴────────────────────────────┘
│               PostgreSQL Database Layer                │
│    (Indexes on date, account_id, type, and category)   │
│     * Computes aggregates in single-digit ms *         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Financial Metrics & Formulas

| Metric | Calculation / Formula | Filtering Rules |
| :--- | :--- | :--- |
| **Period Income** | $\sum \text{amount}$ where $\text{type} = \text{'INCOME'}$ | Date in period; exclude transfers |
| **Period Expenses** | $\sum \text{amount}$ where $\text{type} = \text{'EXPENSE'}$ | Date in period; exclude transfers |
| **Net Cash Flow** | $\text{Period Income} - \text{Period Expenses}$ | Exclude transfers |
| **Category Spending**| $\sum \text{amount}$ grouped by $\text{category\_id}$ | $\text{type} = \text{'EXPENSE'}$; date in period |
| **Daily Spending** | $\sum \text{amount}$ grouped by $\text{date}$ | $\text{type} = \text{'EXPENSE'}$; date in period |
| **Month-over-Month**| $\Delta\% = \frac{\text{Spend}_{M} - \text{Spend}_{M-1}}{\text{Spend}_{M-1}} \times 100$ | Per category spend for month $M$ vs $M-1$ |
| **Latest Balance** | Most recent `running_balance` ordered by `date DESC, created_at DESC` | Filter by user / account |

---

## 3. Dedicated Database Functions / RPC Specifications

### 3.1. Dashboard Summary Function (`get_dashboard_summary`)
Returns the 4 primary headline numbers in one round-trip:
```sql
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
    -- 1. Compute Income
    SELECT COALESCE(SUM(amount), 0.00) INTO v_income
    FROM transactions
    WHERE user_id = v_user_id
      AND transaction_type = 'INCOME'
      AND date BETWEEN p_start_date AND p_end_date
      AND (p_account_id IS NULL OR account_id = p_account_id);

    -- 2. Compute Expense
    SELECT COALESCE(SUM(amount), 0.00) INTO v_expense
    FROM transactions
    WHERE user_id = v_user_id
      AND transaction_type = 'EXPENSE'
      AND date BETWEEN p_start_date AND p_end_date
      AND (p_account_id IS NULL OR account_id = p_account_id);

    -- 3. Compute Net Cash Flow
    v_net_flow := v_income - v_expense;

    -- 4. Retrieve Current Balance (Latest running balance)
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
```

### 3.2. Category Spending Aggregation (`get_category_spending`)
Returns sorted category spending with percentage breakdown:
```sql
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
```

### 3.3. Monthly Trend Aggregation (`get_monthly_cash_flow`)
Returns monthly income vs expenses for a given calendar year:
```sql
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
```

### 3.4. Top Merchants Analysis (`get_top_merchants`)
Identifies frequent vendors and total expenditure:
```sql
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
```

---

## 4. Visualization Mapping

* **Dashboard Spending Trend**: Compact Area/Bar Chart displaying monthly or weekly totals.
* **Category Breakdown**: Donut chart highlighting top 5 categories + "Other", paired with a sorted tabular list showing exact values and percentages.
* **Monthly Comparison**: Grouped Dual-Bar chart (Income in Emerald `#16A34A`, Expenses in Crimson `#DC2626`).
* **Daily Trend**: Clean single-line chart with dots on active days.

