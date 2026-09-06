# UI Specification & Design System: FinTrack PWA

## 1. Visual Philosophy & Design Language

FinTrack prioritizes **high information density, crisp typography, and visual tranquility**:
* **Palette**: Neutral monochromatic base (pure white `#FFFFFF`, cool grey surfaces `#F8FAFC`, subtle borders `#E2E8F0`, slate typography `#0F172A`).
* **Accent Color**: Deep Navy/Indigo (`#1E293B` primary, `#3B82F6` interactive blue for links/actions).
* **Semantic Colors**:
  * **Income / Positive Cash Flow**: Emerald Green (`#16A34A` text, `#DCFCE7` light chip background).
  * **Expense / Outflow**: Crimson Red (`#DC2626` text, `#FEE2E2` light chip background).
  * **Transfer / Internal Neutral**: Muted Slate (`#64748B` text, `#F1F5F9` light chip background).
* **Surfaces & Elevation**: Flat or single-layer subtle border (`1px solid #E2E8F0`). Avoid heavy drop shadows or 3D skeuomorphism.
* **Component Rounding**: Clean 8px border-radius (`theme.shape.borderRadius = 8`) on buttons, cards, and modal sheets.
* **Touch Targets**: Minimum 48px height on interactive mobile elements (buttons, list items, navigation icons).

---

## 2. Standard Reusable UI Components

| Component | Responsibility | Props / Variations |
| :--- | :--- | :--- |
| `PageHeader` | Standard title, subtitle, breadcrumb, and desktop action slot | `title`, `subtitle`, `action`, `breadcrumbs` |
| `StatCard` | Minimal metric card displaying key figure, percentage delta, and sparkline | `label`, `value`, `deltaPercent`, `isPositive`, `loading` |
| `AmountDisplay` | Color-coded monetary formatter showing sign and symbol | `amount`, `currency`, `type (INCOME\|EXPENSE\|TRANSFER)`, `size (sm\|md\|lg)` |
| `CategoryChip` | Subtle rounded badge indicating category | `name`, `colorHex`, `size (small)` |
| `TransactionCard` | Mobile card displaying transaction row | `transaction`, `onSelect`, `onEdit` |
| `TransactionTable` | Dense desktop table with sorting and action menu | `transactions`, `loading`, `onRowClick`, `page`, `onPageChange` |
| `EmptyState` | Helpful placeholder with actionable button | `title`, `description`, `icon`, `actionLabel`, `onAction` |
| `LoadingSkeleton` | Responsive skeleton matching table or card layout | `type ('cards' \| 'table' \| 'metrics')`, `rows` |
| `ErrorState` | Non-technical error banner with retry trigger | `message`, `onRetry` |
| `FilterBar` | Quick chip toggles + button to open filter drawer | `activeFilters`, `onFilterChange`, `onOpenDrawer` |

---

## 3. Screen-by-Screen UI Specification

### 3.1. Dashboard (`/dashboard`)
* **Purpose**: Immediate visibility into financial posture for current month or selected period.
* **User Actions**: Switch period (This Month, Last Month, This Year, Custom); filter by account; click recent transaction to inspect; click quick "Add Transaction" FAB.
* **Components**: `PageHeader`, `PeriodSelector`, `StatCard` (x4: Balance, Income, Expenses, Net Flow), `SpendingTrendChart` (Recharts Bar/Area), `TopCategoriesWidget` (Horizontal progress bars), `RecentTransactionsWidget`.
* **Queries**: `useDashboardSummary(period, accountId)`, `useRecentTransactions(limit=5)`.
* **Loading State**: 4 skeleton stat boxes, skeleton chart rectangle, skeleton list.
* **Empty State**: Prompt: *"No transactions found for this period. Upload a bank statement to see your overview."* CTA: *"Import Statement"*.
* **Error State**: Error banner with *"Failed to load financial overview"* + `Retry` button.
* **Mobile Layout**: 1-column vertical scroll. Stat cards as a 2x2 grid or swipeable row. Quick FAB visible.
* **Desktop Layout**: 4-column metric cards row. 2-column split below (Left 65%: Spending Trend + Recent Transactions; Right 35%: Category Breakdown + Quick Links).

### 3.2. Transactions (`/transactions`)
* **Purpose**: Primary financial ledger for search, filtering, reviewing running balance, editing, and auditing.
* **User Actions**: Search narration, toggle type chips (All, Expense, Income, Transfer), apply advanced date/amount/account filters, paginate, select row to open details, click Add/Edit/Delete.
* **Components**: `SearchInput`, `TransactionFilterBar`, `TransactionList` (Mobile cards), `TransactionTable` (Desktop table), `TransactionDetailDrawer`, `PaginationControls`.
* **Queries**: `useTransactions(filters, pagination)`.
* **Mutations**: `useDeleteTransaction()`, `useUpdateTransaction()`.
* **Loading State**: Desktop: 10 animated table row skeletons. Mobile: 5 card skeletons.
* **Empty State**: *"No transactions matching criteria. Try adjusting your filters or search terms."* CTA: *"Clear Filters"*.
* **Mobile Layout**: Fixed search bar at top with filter icon. Infinite scroll or bottom pagination. Tap card opens bottom sheet details.
* **Desktop Layout**: Top toolbar with search, filters, date picker, export button. Dense MUI Table with fixed headers and pagination footer. Click row opens side drawer.

### 3.3. Add / Edit Transaction Form (`/transactions/new` or Dialog)
* **Purpose**: Rapid manual entry or correction of a transaction.
* **User Actions**: Toggle Type (Income / Expense / Transfer), Enter Amount, Pick Date, Select Account (and Destination Account if Transfer), Select Category, Type Description/Narration, Enter Notes.
* **Components**: `SegmentedButton` (Income / Expense / Transfer), `CurrencyInput`, `FormDatePicker`, `AccountSelect`, `CategorySelect`, `TextField` (Notes).
* **Validation**:
  * Amount must be $> 0$.
  * Date must not be in the future (or warning given).
  * Account required.
  * If Transfer: Source account cannot equal Destination account.
* **Mobile Layout**: Full-screen slide-up dialog with sticky bottom "Save Transaction" button.
* **Desktop Layout**: Centered modal dialog (width 500px) with Cancel and Submit buttons.

### 3.4. Analytics (`/analytics`)
* **Purpose**: Deep exploratory analysis of spending habits, income sources, and temporal trends.
* **User Actions**: Switch sub-tabs (Overview, Spending, Income, Trends); toggle date periods; filter by specific bank/account.
* **Components**: `MUITabs`, `MonthlyCashFlowChart` (Income vs Expense grouped bar chart), `CategoryBreakdownChart` (Donut + sorted table), `DailySpendingChart` (Line chart), `MonthOverMonthTable` (Comparative table with % change), `TopMerchantsList`.
* **Queries**: `useAnalyticsCategorySpending(period)`, `useAnalyticsMonthlyTrends(year)`, `useTopMerchants(period)`.
* **Mobile Layout**: Sub-tabs as horizontal scrollable pills. Full-width touch-friendly charts with tooltip cards on touch.
* **Desktop Layout**: Sub-tab navigation under header. Grid layout for charts with side-by-side comparison tables.

### 3.5. Import Wizard (`/import/*`)
* **Purpose**: 4-step progressive disclosure pipeline to safely ingest bank statement files.
* **Steps**:
  1. `/import/upload`: Drag & drop Excel/CSV file + Select target Account.
  2. `/import/map`: Auto-detected column mapping preview with interactive dropdown overrides (`Date`, `Description`, `Deposit`, `Withdrawal`, `Balance`).
  3. `/import/preview`: Tabular preview showing validated rows, warning flags, and detected duplicates with individual `Skip / Import Anyway` toggles.
  4. `/import/result`: Import confirmation showing total imported, duplicates skipped, auto-categorized count, and button to view imported transactions.
* **Components**: `Stepper`, `FileDropzone`, `ColumnMappingTable`, `ImportPreviewTable`, `DuplicateMatchBadge`.
* **Queries / Mutations**: `useParseFile()`, `useValidateImport()`, `useExecuteBatchImport()`.
* **Error Handling**: Row-level validation highlighting (e.g., malformed date strings, negative balances, missing numbers).

### 3.6. Settings & Master Data (`/settings/*`)
* **Purpose**: Configure banks, accounts, categories, auto-rules, and data management.
* **User Actions**:
  * `/settings/banks`: Add bank name, view accounts per bank.
  * `/settings/accounts`: Create savings/credit card account, set opening balance and currency.
  * `/settings/categories`: View Income/Expense tree, add new custom categories, archive unused categories.
  * `/settings/rules`: Create description keyword match rules (`"UBER" -> Transportation`).
  * `/settings/data-management`: Download full JSON/CSV export, inspect import batches and rollback (delete) mistake batches.
* **Mobile & Desktop Layout**: Grouped MUI List with icons and chevron right leading into dedicated sub-screens.

