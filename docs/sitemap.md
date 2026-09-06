# Site Map & Route Hierarchy: FinTrack PWA

## 1. Information Architecture Overview

FinTrack separates routes into **Public (Unauthenticated)** and **Protected (Authenticated)** trees. The navigation model adapts between mobile viewports (persisting a bottom navigation bar and floating actions) and desktop viewports (persisting a top/side app bar with centered content).

```
/
├── (auth)
│   ├── /login                     # Authentication (Magic Link / Email Password)
│   └── /register                  # Account sign-up
│
├── (app)                          # Protected shell with AuthGuard & AccountContext
│   ├── /dashboard                 # Overview & key metrics (Default redirect from /)
│   │
│   ├── /transactions              # Unified ledger
│   │   ├── /                      # Transaction list (Mobile: Cards, Desktop: Table)
│   │   ├── /new                   # Add transaction modal/page
│   │   └── /:id                   # Transaction details & edit/delete drawer
│   │
│   ├── /analytics                 # Financial analysis & insights
│   │   ├── /overview              # Income vs Expense & Monthly Trends (Default)
│   │   ├── /spending              # Category spending & Pareto breakdown
│   │   ├── /income                # Income source analysis
│   │   └── /trends                # Date-wise trends & MoM variance
│   │
│   ├── /import                    # Statement ingestion wizard
│   │   ├── /upload                # File upload (drag & drop / file picker)
│   │   ├── /map                   # Header detection & column mapping
│   │   ├── /preview               # Validation & duplicate inspection
│   │   └── /result                # Batch summary & import confirmation
│   │
│   ├── /settings                  # System preferences & master data
│   │   ├── /                      # Main settings menu
│   │   ├── /banks                 # Bank management (List, Add, Edit)
│   │   ├── /accounts              # Account management (List, Add, Edit)
│   │   ├── /categories            # Category hierarchy management
│   │   ├── /rules                 # Auto-categorization rule engine
│   │   ├── /import-history        # Ingestion batch history & rollbacks
│   │   ├── /preferences           # Currency, Date format, Default Account
│   │   └── /data-management       # JSON/CSV full export & ledger reset
│   │
│   └── /404                       # Page not found fallback
```

---

## 2. Navigation Paradigms (Desktop vs. Mobile)

### 2.1. Desktop Navigation (Viewport $\ge 1024\text{px}$)
* **Top Header / App Bar**:
  * **Brand**: "FinTrack" logo + Account quick switcher dropdown.
  * **Primary Links**:
    1. `Dashboard` (`/dashboard`)
    2. `Transactions` (`/transactions`)
    3. `Analytics` (`/analytics`)
    4. `Import` (`/import/upload`)
  * **Actions**:
    * `+ New Transaction` (Primary contained button opens modal).
    * `Settings` (Icon button linking to `/settings`).
    * `User Profile / Logout` (Avatar menu).
* **Secondary Navigation (Sub-screens)**:
  * Banks, Accounts, Categories, and Rules are accessible directly via `/settings` or contextual links inside forms.

### 2.2. Mobile Navigation (Viewport $< 1024\text{px}$)
* **Top App Bar**:
  * Screen title (e.g., "Transactions", "September 2026").
  * Filter trigger icon button (opens Bottom Sheet filter panel).
  * Account switcher dropdown or avatar icon.
* **Bottom Navigation Bar (Fixed 4 Items)**:
  1. `Home` (`/dashboard`) - `DashboardOutlined`
  2. `Transactions` (`/transactions`) - `ReceiptLongOutlined`
  3. `Analytics` (`/analytics`) - `BarChartOutlined`
  4. `Settings` (`/settings`) - `SettingsOutlined`
* **Floating Action Button (FAB)**:
  * Fixed at bottom-right (above the bottom navigation bar).
  * Icon: `+` (Add Transaction). Opens full-screen or slide-up add transaction form.

---

## 3. URL Parameter & Query State Contract

FinTrack maintains search and filter states in URL search parameters to ensure deep linking, browser history support, and shareable states.

| Route | Query Parameters | Description |
| :--- | :--- | :--- |
| `/transactions` | `?q=swiggy` | Full-text search keyword across narration/category |
| | `?bank_id=uuid` | Filter transactions by specific bank |
| | `?account_id=uuid` | Filter transactions by account |
| | `?category_id=uuid`| Filter transactions by category |
| | `?type=INCOME\|EXPENSE\|TRANSFER` | Quick filter for transaction type |
| | `?start_date=YYYY-MM-DD` | Start of date range window |
| | `?end_date=YYYY-MM-DD` | End of date range window |
| | `?min_amount=N&max_amount=M` | Amount magnitude range |
| | `?page=1&page_size=50` | Pagination control |
| `/analytics` | `?period=this_month\|last_month\|this_year\|custom` | Predefined or custom time horizon |
| | `?account_id=all\|uuid` | Restrict analytics to specific account |
| | `?from=YYYY-MM-DD&to=YYYY-MM-DD` | Custom period bounds |
| `/import/*` | `?batch_id=uuid` | Current active import session identifier |
| `/settings/categories` | `?type=INCOME\|EXPENSE` | Tab switcher for category group |

