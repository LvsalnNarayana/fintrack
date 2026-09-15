# FinTrack — Application Summary (Android Build Brief)

Use this file as the **source of truth** when prompting an AI or developer to build a **native Android app in Java** for FinTrack. Attach `summary.md` and ask them to implement against this specification.

---

## 1. What FinTrack Is

**FinTrack** is a private, mobile-first **personal finance** app. Users upload bank statements (CSV/Excel) or add transactions manually, then categorize and analyze spending — **without** bank logins, screen scraping, or selling data.

It is **not** a budgeting marketplace or bank aggregator. It is a **personal ledger + analytics utility**.

### Core problem
People manage 2–4 accounts, download monthly statements, and still cannot easily answer:
- How much did I spend on Food this month vs last month?
- What is my real net cash flow across accounts?
- Which days / merchants drain money?

### Product principles
1. Utility first — clean, dense, low clutter.
2. Mobile-first touch targets and simple navigation.
3. Statement files are import inputs only; the durable model is normalized transactions.
4. No bank credentials stored.
5. Money math must be precise (`NUMERIC(12,2)` / BigDecimal — never float).
6. Transfers must not inflate income/expense totals.

---

## 2. Existing Web App (reference implementation)

| Item | Detail |
|------|--------|
| Name | FinTrack |
| Current client | React 18 + TypeScript + Vite + MUI PWA |
| Backend | Hosted **Supabase** (PostgreSQL + Auth + Row Level Security) |
| Auth style | Username/password (Supabase Auth under the hood) |
| Default currency | INR (configurable) |
| Demo mode | If Supabase is not configured, web app can run with local sample data |

The Android app should be a **new native client** that talks to the **same Supabase project/schema**. Do **not** invent a parallel database.

---

## 3. Domain Model (must match)

Hierarchy:

```text
User / Profile
  └── Bank (HDFC, ICICI, …)
        └── Account (Salary, Savings, Credit Card, …)
              └── Transaction
                    ├── optional Category
                    └── optional ImportBatch
```

### Entities

**Profile**
- Preferences: base currency, date format, display name.

**Bank**
- `id`, `user_id`, `name`, timestamps.

**Account**
- Belongs to one bank.
- `name`, `account_type` ∈ `SAVINGS | CURRENT | SALARY | CREDIT_CARD | CASH | OTHER`
- `currency` (ISO 4217, e.g. `INR`)
- `opening_balance`, `is_active`

**Category**
- `name`, `type` ∈ `INCOME | EXPENSE`
- optional parent (tree)
- `color`, `is_archived` (archive instead of hard-delete when used historically)

**Transaction**
- Belongs to one `account_id` (bank comes via account).
- `date` (`YYYY-MM-DD`)
- `description`
- `amount` — **positive magnitude only**
- `transaction_type` ∈ `INCOME | EXPENSE | TRANSFER`
- `deposit`, `withdrawal`
- `running_balance` (nullable)
- `currency`
- `notes` (nullable)
- `category_id` (nullable)
- `import_batch_id` (nullable)
- `transfer_pair_id` (nullable, for linked transfers)

**ImportBatch**
- One uploaded statement session.
- Tracks filename/hash, counts, account.
- Deleting a batch should remove its imported transactions (rollback).

**CategorizationRule** (optional / later)
- Keyword/regex → category auto-assign during import.

### Money rules
- Store/display with 2 decimal places.
- On Android use `BigDecimal` (or integer cents), never `float`/`double` for totals.
- Income = sum of `INCOME` amounts in period.
- Expense = sum of `EXPENSE` amounts in period.
- Net cash flow = Income − Expense (**exclude TRANSFER** from income/expense aggregates).

---

## 4. Screens & Features (parity target)

Bottom / primary navigation (mobile):

1. **Home / Dashboard**
2. **Transactions (Ledger)**
3. **Calendar**
4. **Analytics**
5. **Settings**

Also: **Login**, **Import Wizard**, and **Add/Edit Transaction**.

### 4.1 Login
- Username + password auth against Supabase.
- Session persistence.
- Protected app shell when logged in.

### 4.2 Dashboard
- Period selector: This Month, Last Month, This Year, Custom Month, All Time.
- Account filter (see Account UX rules below).
- KPI cards: Income, Expenses, Net Cash Flow, Current Balance.
- Top categories widget.
- Recent transactions list.
- Quick actions: Add Transaction, Import Statement.

### 4.3 Transactions (Ledger)
- Paginated list (cards on phone).
- Search description / category / notes.
- Filters:
  - Period presets **and** custom month **and** custom from–to range
  - Type chips: All / Expense / Income / Transfer
  - Account, Category, Min/Max amount
  - Sort newest/oldest by date
- Manual add / edit / delete (delete may require settings password confirmation).
- **Export CSV** of filtered results (all matching rows, not only current page).
- Active filter chips + clear filters.

### 4.4 Calendar
- Month grid (Google Calendar–style week headers).
- Prev / Next month + Today.
- Account filter.
- Month summary: income, expense, net, active days.
- Days **with transactions** are tinted (deeper red ≈ higher spend). Empty days stay normal.
- Red/green dots for expense/income presence.
- Tap day → dialog:
  - Left: category pie for that day’s expenses
  - Right: list of that day’s transactions
  - Day totals (spent / income / net)
  - Prev/next day navigation
  - “Open in ledger” deep-link into Transactions filtered to that date

### 4.5 Analytics
- Period + Custom Month + Account + Type filters.
- Tabs:
  - Monthly cash flow (Income vs Expense bars)
  - Category spending (donut + ranked table)
  - Top merchants
  - Search totals (merchant/description insights)
- Click a category row → modal listing that category’s expense transactions for the selected period.

### 4.6 Import Wizard
- Select target account.
- Upload `.csv` / `.xlsx` / `.xls`.
- Detect/map columns (Date, Description, Deposit, Withdrawal, Balance).
- Preview + duplicate detection (Skip / Import Anyway).
- Commit as an `import_batch`.
- Settings: import history + batch rollback.

### 4.7 Settings
- Manage Banks, Accounts, Categories.
- Import history / rollback.
- Preferences (currency, etc.).
- Sensitive actions (delete all / destructive edits) gated by settings password.

---

## 5. Account dropdown UX rule (important)

**Wherever an Account dropdown exists:**
- If the user has **exactly one** account → **select it by default**.
- If multiple accounts → default to “All Accounts” for filter screens (unless a single account is required, e.g. Import / Add Transaction form, where user must pick one; still auto-select when only one exists).

Applies to: Dashboard, Transactions, Calendar, Analytics, Import, Add Transaction form.

---

## 6. Backend / API contract (Supabase)

### Config
Android should read from local properties / BuildConfig (do not hardcode secrets in git):

```text
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_PUBLISHABLE_OR_ANON_KEY=<key>
DEFAULT_CURRENCY=INR
SETTINGS_PASSWORD=fintrack123   # optional client-side gate for destructive actions
```

### Auth
- Supabase Auth username/password (or email-mapped username flow used by web).
- All table access filtered by RLS on `auth.uid()`.

### Core tables
`profiles`, `banks`, `accounts`, `categories`, `transactions`, `import_batches`, `categorization_rules`

### Useful RPCs (already in web schema)
- `get_dashboard_summary(p_start_date, p_end_date, p_account_id)`
- `get_category_spending(p_start_date, p_end_date, p_account_id)`
- `get_monthly_cash_flow(p_year, p_account_id)`
- Plus merchant / search insight queries used by the web analytics service

Prefer server-side aggregation for analytics. Do **not** download tens of thousands of rows to compute charts on device unless offline cache is an explicit later phase.

### Transaction query filters
Support: `search`, `account_id`, `category_id`, `transaction_type`, `start_date`, `end_date`, `min_amount`, `max_amount`, sort, pagination.

Special case: category filter value `uncat` means `category_id IS NULL`.

---

## 7. Visual / UX direction for Android

- Material Design 3 (or Material Components).
- Light theme first.
- Palette inspiration from web:
  - Primary slate `#1e293b`
  - Accent blue `#3b82f6`
  - Income green `#16a34a`
  - Expense red `#dc2626`
  - Canvas `#f8fafc`
- Currency formatting: Indian locale (`en-IN`) with `₹` when currency is INR.
- Amounts: green for income, red for expense, neutral for transfers.
- Dense but readable lists; avoid dashboard clutter on first paint of each screen.

---

## 8. Android technical requirements (mandatory)

Build a **native Android app in Java** (developer does **not** know Kotlin).

### Required stack
- **Language:** Java 17 (or project-compatible Java)
- **UI:** XML layouts + Activities/Fragments (**not** Jetpack Compose)
- **Jetpack:** AppCompat, Material, Navigation Component, ViewModel, LiveData (or equivalent Java-friendly observers), ViewBinding
- **Networking:** Supabase Java/Kotlin-interop client **or** Retrofit/OkHttp against Supabase REST + Auth endpoints
- **JSON:** Gson or Moshi
- **Charts:** MPAndroidChart or equivalent (pie + bar)
- **CSV import/export:** OpenCSV or Apache Commons CSV; Excel import can be phase-2 if heavy
- **Architecture:** simple layered MVVM
  - `ui` → `viewmodel` → `repository` → `remote` (Supabase)
- Package suggestion: `com.fintrack.app`

### Explicit non-goals for v1 Android
- No Compose
- No Kotlin source (dependency jars that are Kotlin-based are OK if called from Java)
- No bank scraping / UPI / SMS reading
- No floating-point money math

### Suggested delivery phases
**Phase 1 — MVP**
1. Login + session
2. Dashboard KPIs
3. Transactions list + filters + add/edit
4. Account/bank/category settings (basic)
5. Single-account auto-select

**Phase 2**
6. Calendar month view + day dialog
7. Analytics (cash flow + category pie + category drill-down)
8. CSV export

**Phase 3**
9. Statement import wizard (CSV first, Excel later)
10. Import history rollback
11. Offline cache (Room) optional

---

## 9. Ready-to-use prompt (copy below)

Paste this prompt and attach this `summary.md` file:

```text
Read the attached summary.md carefully. It describes FinTrack, an existing personal finance web app backed by Supabase.

Build a native Android application for FinTrack using:
- Java only (no Kotlin source files; I do not know Kotlin)
- Jetpack with XML layouts / Fragments / Activities (NO Jetpack Compose)
- MVVM + Repository architecture
- Material Design
- Same domain model, screens, filters, and money rules as summary.md
- Same Supabase backend (Auth + Postgres RLS + listed RPCs)

Start with Phase 1 MVP from summary.md:
Login, Dashboard, Transactions (list/filter/add/edit), Settings basics, and auto-select account when only one exists.

Generate the Android Studio project structure, Gradle files, packages, and first working screens with clear TODO markers for Supabase credentials. Follow summary.md as the product and API contract. Ask before inventing features not listed there.
```

---

## 10. Acceptance checklist (Android)

- [ ] Java + XML Jetpack only (no Compose)
- [ ] Login works with Supabase session restore
- [ ] Dashboard shows period KPIs for selected account/period
- [ ] Transactions support period presets, custom month, custom range, type, account, category, amount, search, sort, pagination
- [ ] Single account auto-selected everywhere relevant
- [ ] Add/edit transaction with INCOME / EXPENSE / TRANSFER
- [ ] Transfers excluded from income/expense totals
- [ ] BigDecimal (or cents) for money
- [ ] Calendar day tint + day dialog pie/list (Phase 2)
- [ ] Analytics category click → transaction list (Phase 2)
- [ ] CSV export of filtered ledger (Phase 2)
- [ ] Import wizard + batch rollback (Phase 3)

---

## 11. Notes for implementers

- Prefer reusing Supabase RPCs for analytics instead of recomputing in Android.
- Keep UI mobile-first; phone is the primary device.
- Match semantics of the web app even if visual layout differs slightly for Android patterns (bottom nav, toolbars, dialogs).
- When unsure, choose the simpler utility-first UX over decorative complexity.
