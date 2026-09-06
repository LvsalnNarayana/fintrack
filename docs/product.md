# Product Specification: Personal Finance PWA

## 1. Executive Summary

**FinTrack** is a minimal, modern, mobile-first personal finance Progressive Web App (PWA) designed to give individuals clear, frictionless visibility and control over their finances by transforming raw bank statements (Excel/CSV) into a structured financial ledger.

Unlike commercial personal finance tools that require third-party bank screen-scraping, sell user data, or overwhelm users with complex budgeting features, FinTrack acts as a **private personal finance utility**. It focuses on fast statement ingestion, accurate multi-bank/multi-account aggregation, flexible categorization, clear spending trends, and robust privacy.

---

## 2. Product Philosophy & Design Principles

1. **Utility First, Zero Fluff**: Clean typography, minimal visual complexity, plenty of whitespace, and high information density without clutter.
2. **Mobile-First & PWA Native**: Fast load times, touch-friendly targets, installable directly from Chrome/mobile browsers, offline viewing of cached transactions.
3. **No Over-Engineering**: Material UI (MUI) standard components tailored with a refined, cohesive theme. No sprawling custom design systems or unnecessary animations.
4. **Statement as Source, Not Primary Model**: Excel/CSV files are ephemeral import inputs. Once ingested, transactions exist in a normalized, queryable domain model.
5. **Decoupled Architecture**: Frontend cleanly separated across UI, Hooks, Services, and Data layers. While powered by Supabase/PostgreSQL in V1, the service contract allows swapping or supplementing with a custom backend (e.g., Spring Boot) in future iterations.
6. **Financial Precision**: Absolute mathematical correctness. Zero floating-point arithmetic. Monetary amounts stored as PostgreSQL `NUMERIC(12,2)` and handled via integer cents or high-precision math in frontend utilities.

---

## 3. User Personas & Core Problem

### Persona: The Intentional Tracker
* **Profile**: Working professional managing 2–4 bank accounts (e.g., Salary account, Household/Joint account, Personal expense savings, Emergency fund).
* **Pain Points**:
  * Manual entry into mobile apps is tedious and prone to being abandoned.
  * Automatic sync aggregators often fail, break MFA, or feel invasive.
  * Monthly bank statements in PDF/Excel sit unanalyzed in download folders.
  * Difficulty answering basic questions: *"How much did I actually spend on food & dining last month compared to this month?"* or *"What is my true net cash flow across all accounts?"*

---

## 4. Key Functional Capabilities (V1 Scope)

### 4.1. Account & Bank Management
* Hierarchy: `User -> Banks -> Accounts -> Transactions`.
* Manage financial institutions (e.g., HDFC, ICICI, SBI, Chase).
* Manage individual accounts with currency, account type (Savings, Current, Salary, Credit Card, Cash, Other), and active status.

### 4.2. Ingestion & Transformation Engine
* Upload statements via `.csv`, `.xlsx`, or `.xls`.
* Flexible column detection and interactive mapping (handles varying bank header formats).
* Batch tracking: every import belongs to an `import_batch` with file metadata, timestamp, and row count.
* Transactional rollbacks: ability to delete an entire import batch if corrupted or misaligned.
* Duplicate detection: composite matching on Account, Date, Normalized Description, Amount, and Currency with user overrides (Skip vs Import Anyway).

### 4.3. Transaction Ledger & Management
* Unified ledger across all accounts or filtered by bank/account.
* Responsive presentation:
  * **Mobile**: Compact cards with Date, Description, Category, Net Amount (positive/negative badge), and Running Balance.
  * **Desktop**: Dense, readable data table with sorting, pagination, and quick actions.
* Manual addition, editing, and soft/hard deletion of transactions.
* Full-text search across descriptions, categories, and notes.
* Multi-dimensional filtering: Date range, Bank, Account, Category, Transaction Type (Income, Expense, Transfer), and Amount bounds.

### 4.4. Transfer Representation
* First-class support for internal transfers between accounts.
* Prevents transfers from distorting income or expense aggregates.
* Linked transfer transaction pairs or dedicated transfer records.

### 4.5. Categorization
* User-managed category taxonomy with parent-child hierarchy (Income vs Expense groups).
* Safe archival mechanism: categories referenced by existing transactions cannot be abruptly deleted; they are archived to preserve historical reporting.
* Foundation for rule-based auto-categorization (regex/keyword matching on statement narration).

### 4.6. Analytics & Insights
* Real-time metrics powered by PostgreSQL database views and aggregations:
  * Period Income, Period Expenses, Net Cash Flow (`Income - Expenses`), and Current Running Balance.
  * Spending by Category (totals and percentage of expenditure).
  * Monthly and daily spending trends.
  * Month-over-Month (MoM) comparative variance (`Current Month vs Previous Month`).
  * Top recurring merchants and narration patterns.
* Focused charts: Minimal bar charts, line charts, and clean donut breakdowns using Recharts.

---

## 5. Non-Functional Requirements

| Metric / Dimension | Target / SLA |
| :--- | :--- |
| **Performance** | Sub-second filter and query execution for ledgers exceeding 50,000 transactions via database-level indexing and pagination. |
| **PWA Compliance** | Lighthouse PWA score $\ge 90$; web app manifest, offline service worker caching of app shell and static assets. |
| **Security & Privacy**| Zero banking credentials stored. All user data isolated via Supabase Row-Level Security (RLS). Strict HTTPS. |
| **Responsive Range**| Seamless scaling across mobile viewports (360px+), tablets (768px+), laptops (1024px+), and ultrawide desktops (1440px+). |
| **Reliability** | All statement imports execute in single transactional batches to prevent partial imports upon network drops or validation failures. |

