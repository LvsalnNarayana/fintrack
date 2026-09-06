# System Architecture: FinTrack PWA

## 1. Architectural Principles & Layered Design

FinTrack implements a strict **4-Tier Frontend Layering Model** enforcing unidirectional data flow and clean separation of concerns:

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│      (React Components, MUI Widgets, Pages, Dialogs)    │
└───────────────────────────┬────────────────────────────┘
                            │ Calls custom hooks
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Hook / Controller Layer              │
│       (TanStack Query Hooks, Local State, URL State)   │
└───────────────────────────┬────────────────────────────┘
                            │ Invocates domain services
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Service / Repository Layer           │
│   (TransactionService, AccountService, AnalyticsService)│
│          * Pure TypeScript, Framework Agnostic *       │
└───────────────────────────┬────────────────────────────┘
                            │ Interacts via Client Adapter
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Data / Infrastructure Layer            │
│         (Supabase Client, PostgREST RPC, Storage)      │
│     * Can be replaced by Spring Boot REST API later *  │
└────────────────────────────────────────────────────────┘
```

### 1.1. Core Separation Rules
1. **Zero Direct Supabase Calls in UI**: No UI component or page file imports `@supabase/supabase-js`. All remote access is mediated by feature services through React Query hooks.
2. **Server State vs. UI State Separation**:
   * **Server State** (Ledgers, balances, accounts, categories, analytics aggregates) is handled exclusively via **TanStack Query** with deterministic cache keys and background invalidation.
   * **UI State** (Modal visibility, active drawer, filter drawer toggle) is kept strictly local via `useState` or React Context.
   * **URL State** (Active tab, search keyword, date filters, page index) is synced to URL search parameters via React Router.
3. **No Redux / Heavy State Managers**: TanStack Query + URL params eliminate 95% of state management boilerplate without introducing Redux, Zustand, or MobX.

---

## 2. Decoupling for Future Backend (e.g., Spring Boot)

To ensure the frontend is not locked into Supabase and can seamlessly transition to a Java / Spring Boot API in V2/V3:

1. **Service Interfaces**:
   Every domain service defines a clean TypeScript interface (e.g., `ITransactionService`, `IAccountService`, `IImportService`).
   ```typescript
   export interface ITransactionService {
     getTransactions(params: TransactionFilterParams): Promise<PaginatedResult<Transaction>>;
     getTransactionById(id: string): Promise<Transaction>;
     createTransaction(dto: CreateTransactionDTO): Promise<Transaction>;
     updateTransaction(id: string, dto: UpdateTransactionDTO): Promise<Transaction>;
     deleteTransaction(id: string): Promise<void>;
   }
   ```
2. **Adapter Implementation**:
   * In **V1**, `SupabaseTransactionService` implements `ITransactionService` using `@supabase/supabase-js`.
   * In **V2/V3**, `SpringTransactionService` can implement `ITransactionService` using standard `fetch` or `axios` communicating with a Spring Boot REST API (`/api/v1/transactions`).
3. **Domain Entities vs. Raw DTOs**:
   Database-specific table schemas (e.g., `raw_postgrest_transaction`) are mapped to canonical camelCase domain entities (e.g., `Transaction`) inside the service layer before reaching hooks.

---

## 3. Complete Project Tree

```text
fintrack/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vite-env.d.ts
├── pwa.config.ts
├── public/
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── maskable-icon-512.png
│   ├── robots.txt
│   └── manifest.webmanifest
├── docs/
│   ├── product.md
│   ├── sitemap.md
│   ├── architecture.md
│   ├── ui.md
│   ├── data-model.md
│   ├── import-flow.md
│   └── analytics.md
├── schema.md
└── src/
    ├── main.tsx
    │
    ├── app/
    │   ├── App.tsx                    # Root component with error boundaries & shell
    │   ├── routes.tsx                 # Route tree with lazy-loaded page modules
    │   ├── providers.tsx              # Combined providers: Query, Theme, Auth, Toast
    │   └── theme.ts                   # Material UI theme configuration & tokens
    │
    ├── assets/
    │   └── icons/                     # SVG brand icons and bank glyphs
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx           # Responsive shell wrapping TopBar & BottomNav
    │   │   ├── TopAppBar.tsx          # Desktop / Mobile header
    │   │   ├── BottomNavBar.tsx       # Fixed mobile bottom navigation
    │   │   └── ContainerLayout.tsx    # Centered responsive content container
    │   │
    │   ├── navigation/
    │   │   ├── NavItem.tsx            # Desktop navigation tab item
    │   │   └── AccountSwitcher.tsx    # Bank & account switcher dropdown
    │   │
    │   ├── feedback/
    │   │   ├── EmptyState.tsx         # Reusable friendly empty view with call-to-action
    │   │   ├── LoadingSkeleton.tsx    # Configurable MUI Skeleton table/card placeholder
    │   │   ├── ErrorState.tsx         # User-friendly error message with retry button
    │   │   └── ToastNotification.tsx  # Centralized Snackbar notification
    │   │
    │   ├── forms/
    │   │   ├── FormDatePicker.tsx     # Standardized date picker field
    │   │   ├── CurrencyInput.tsx      # Numeric money field with currency symbol
    │   │   └── CategorySelect.tsx     # Hierarchical autocomplete category dropdown
    │   │
    │   └── common/
    │       ├── AmountDisplay.tsx      # Semantic colored amount (+₹ green, -₹ red)
    │       ├── CategoryChip.tsx       # Subtle colored chip for category tags
    │       ├── StatCard.tsx           # Compact dashboard metric card
    │       └── ConfirmDialog.tsx      # Generic confirmation modal for deletions
    │
    ├── features/
    │   ├── auth/
    │   │   ├── components/LoginForm.tsx
    │   │   ├── hooks/useAuth.ts
    │   │   ├── services/authService.ts
    │   │   ├── types/auth.types.ts
    │   │   └── pages/LoginPage.tsx
    │   │
    │   ├── dashboard/
    │   │   ├── components/
    │   │   │   ├── DashboardMetrics.tsx
    │   │   │   ├── SpendingTrendChart.tsx
    │   │   │   ├── TopCategoriesWidget.tsx
    │   │   │   └── RecentTransactionsWidget.tsx
    │   │   ├── hooks/useDashboardSummary.ts
    │   │   ├── services/dashboardService.ts
    │   │   ├── types/dashboard.types.ts
    │   │   └── pages/DashboardPage.tsx
    │   │
    │   ├── transactions/
    │   │   ├── components/
    │   │   │   ├── TransactionTable.tsx      # Desktop compact table
    │   │   │   ├── TransactionCard.tsx       # Mobile responsive card
    │   │   │   ├── TransactionList.tsx       # Virtualized/paginated card container
    │   │   │   ├── TransactionFilterBar.tsx  # Quick chips + filter drawer trigger
    │   │   │   ├── TransactionFilterDrawer.tsx # Mobile bottom sheet filter
    │   │   │   ├── TransactionDetailDrawer.tsx # Transaction inspector
    │   │   │   └── TransactionFormDialog.tsx # Add/Edit transaction form
    │   │   ├── hooks/
    │   │   │   ├── useTransactions.ts        # Infinite/paginated query hook
    │   │   │   ├── useTransactionDetails.ts
    │   │   │   └── useTransactionMutations.ts# Add, edit, delete mutations
    │   │   ├── services/transactionService.ts
    │   │   ├── utils/transactionTransforms.ts
    │   │   ├── types/transaction.types.ts
    │   │   └── pages/TransactionsPage.tsx
    │   │
    │   ├── analytics/
    │   │   ├── components/
    │   │   │   ├── CategoryBreakdownChart.tsx
    │   │   │   ├── MonthlyCashFlowChart.tsx
    │   │   │   ├── DailySpendingChart.tsx
    │   │   │   ├── MonthOverMonthTable.tsx
    │   │   │   └── TopMerchantsList.tsx
    │   │   ├── hooks/useAnalytics.ts
    │   │   ├── services/analyticsService.ts
    │   │   ├── types/analytics.types.ts
    │   │   └── pages/AnalyticsPage.tsx
    │   │
    │   ├── import/
    │   │   ├── components/
    │   │   │   ├── FileDropzone.tsx
    │   │   │   ├── ColumnMappingTable.tsx
    │   │   │   ├── ImportPreviewTable.tsx
    │   │   │   ├── DuplicateMatchBadge.tsx
    │   │   │   └── ImportResultSummary.tsx
    │   │   ├── hooks/
    │   │   │   ├── useImportWizard.ts
    │   │   │   └── useImportBatchMutation.ts
    │   │   ├── parsers/
    │   │   │   ├── csvParser.ts
    │   │   │   ├── excelParser.ts
    │   │   │   └── statementDetector.ts
    │   │   ├── validators/importValidator.ts
    │   │   ├── services/importService.ts
    │   │   ├── types/import.types.ts
    │   │   └── pages/ImportWizardPage.tsx
    │   │
    │   ├── banks/
    │   │   ├── components/BankList.tsx
    │   │   ├── hooks/useBanks.ts
    │   │   ├── services/bankService.ts
    │   │   └── types/bank.types.ts
    │   │
    │   ├── accounts/
    │   │   ├── components/AccountList.tsx
    │   │   ├── hooks/useAccounts.ts
    │   │   ├── services/accountService.ts
    │   │   └── types/account.types.ts
    │   │
    │   ├── categories/
    │   │   ├── components/CategoryTree.tsx
    │   │   ├── hooks/useCategories.ts
    │   │   ├── services/categoryService.ts
    │   │   └── types/category.types.ts
    │   │
    │   └── settings/
    │       ├── components/RuleList.tsx
    │       ├── hooks/useRules.ts
    │       ├── services/settingsService.ts
    │       └── pages/SettingsPage.tsx
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts              # Supabase initialized client singleton
    │   │   └── database.types.ts      # Auto-generated Database schema types
    │   │
    │   ├── query/
    │   │   ├── queryClient.ts         # TanStack Query client with default retry/stale times
    │   │   └── queryKeys.ts           # Centralized query key factories
    │   │
    │   ├── storage/
    │   │   └── indexedDB.ts           # Local offline cache store
    │   │
    │   └── utils/
    │       ├── currency.ts            # Formatting currency, precision conversions
    │       ├── date.ts                # Date-fns lightweight helpers
    │       └── error.ts               # User-safe error extractor from API responses
    │
    ├── hooks/
    │   ├── useMediaQuery.ts           # Responsive breakpoints helper
    │   ├── useDebounce.ts             # Search debounce hook
    │   └── useUrlParams.ts            # Typed URL search param synchronization
    │
    └── types/
        ├── common.types.ts            # PaginatedResult, DateRange, ApiResponse
        └── domain.types.ts            # Re-exported canonical domain entities
```

---

## 4. Query Keys & Caching Hierarchy

TanStack Query keys are managed through deterministic key factories:

```typescript
export const queryKeys = {
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filter: TransactionFilterParams) => [...queryKeys.transactions.lists(), filter] as const,
    details: () => [...queryKeys.transactions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    summary: (period: string, accountId?: string) => [...queryKeys.analytics.all, 'summary', period, accountId] as const,
    categorySpending: (period: string, accountId?: string) => [...queryKeys.analytics.all, 'category', period, accountId] as const,
    monthlyTrends: (year: number) => [...queryKeys.analytics.all, 'monthly', year] as const,
  },
  accounts: {
    all: ['accounts'] as const,
    active: () => [...queryKeys.accounts.all, 'active'] as const,
  },
  categories: {
    all: ['categories'] as const,
    tree: () => [...queryKeys.categories.all, 'tree'] as const,
  },
};
```

