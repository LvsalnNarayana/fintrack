# FinTrack — Personal Finance PWA

A minimal, modern, mobile-first **Progressive Web App (PWA)** for tracking, categorizing, and analyzing bank statement transactions. Built with **React 18, TypeScript, Vite, Material UI (MUI), TanStack Query, and Supabase (PostgreSQL)**, deployed on **Vercel**.

---

## 🌟 Key Features

* **Bank Statement Ingestion**: Direct upload of Excel (`.xlsx`, `.xls`) and CSV statements.
* **Intelligent Column Detection**: Fuzzy synonym matching for `Date`, `Description`, `Deposit`, `Withdrawal`, and `Running Balance`.
* **Composite Duplicate Detection**: Identifies repeated statement rows with interactive `[Skip]` and `[Import Anyway]` controls.
* **Atomic Batch Rollbacks**: Purge any statement import batch in one click without leaving orphaned records.
* **Mobile-First Ledger UX**:
  * **Mobile**: Compact cards with date, category tags, net amount badges, and running balance.
  * **Desktop**: Dense data table with sorting, pagination, and side drawer inspector.
* **Internal Transfers**: First-class paired transfer records between accounts that update account balances without distorting user-level income and expense aggregates.
* **Real-time Analytics**: High-performance PostgreSQL RPC procedures for monthly cash flow, category distributions, daily spending trends, and top merchant analytics.
* **PWA Native**: Installable on Android Chrome and iOS Safari with offline application shell caching.
* **Multi-Tenant Security**: Enforced via PostgreSQL **Row Level Security (RLS)** sandboxing all access to `auth.uid()`.

---

## 🛠 Tech Stack

* **Frontend**: React 18, TypeScript, Vite 5, React Router v6
* **Component Library**: Material UI (MUI v5), Emotion, Material Icons
* **Data Fetching & Server State**: TanStack React Query v5
* **Data Visualizations**: Recharts
* **Statement Parsers**: PapaParse (CSV), SheetJS / XLSX (Excel)
* **PWA & Offline Support**: `vite-plugin-pwa`, Workbox
* **Database & Auth**: Hosted Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security)
* **Hosting**: Vercel (Edge network, SPA rewrite rules, PWA caching headers)

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your hosted Supabase credentials:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```
*(Note: If left unconfigured, FinTrack runs in **Demo Mode** with local sample data for immediate evaluation).*

### 3. Initialize Database in Hosted Supabase
1. Open your project in the [Supabase Dashboard](https://app.supabase.com).
2. Navigate to the **SQL Editor**.
3. Copy the contents of [`supabase/migrations/20260906000000_init.sql`](./supabase/migrations/20260906000000_init.sql).
4. Click **Run**. This sets up all tables, triggers, indexes, RLS policies, and analytical RPC functions.

### 4. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 📦 Deploying to Vercel

FinTrack is pre-configured for seamless Vercel deployment:

1. Push your repository to GitHub / GitLab / Bitbucket.
2. In the Vercel Dashboard, click **Add New Project** and import the repository.
3. In **Environment Variables**, add:
   * `VITE_SUPABASE_URL` = `https://<your-project-id>.supabase.co`
   * `VITE_SUPABASE_ANON_KEY` = `<your-anon-key>`
4. Click **Deploy**.

Vercel automatically detects the Vite framework and applies the SPA routing rules defined in [`vercel.json`](./vercel.json).

---

## 📂 Project Structure

```text
src/
├── app/                  # Application root, theme, providers, router
│   ├── App.tsx
│   ├── providers.tsx
│   ├── routes.tsx
│   └── theme.ts
├── components/           # Reusable presentational components
│   ├── common/           # AmountDisplay, CategoryChip, PageHeader, StatCard
│   ├── feedback/         # EmptyState, LoadingSkeleton, ErrorState
│   └── layout/           # AppShell, TopAppBar, BottomNavBar
├── features/             # Feature-oriented domain modules
│   ├── accounts/         # Bank account management
│   ├── analytics/        # Cash flow, category distribution, merchants
│   ├── auth/             # Login, magic links, user sessions
│   ├── banks/            # Institution management
│   ├── categories/       # Taxonomy management
│   ├── dashboard/        # KPI metrics, spending trend, recent transactions
│   ├── import/           # File dropzone, column mapping, preview, deduplication
│   ├── settings/         # Master data and rollback management
│   └── transactions/     # Desktop table, mobile cards, filter bar, manual dialog
├── lib/                  # Infrastructure adapters & utilities
│   ├── query/            # TanStack Query client & key factories
│   ├── supabase/         # Supabase client singleton
│   └── utils/            # Precision currency, dates, errors
└── types/                # Canonical domain models & database contracts
```

---

## 📄 License
MIT

