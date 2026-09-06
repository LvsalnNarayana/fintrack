# Domain Model & Entity Architecture: FinTrack PWA

## 1. Domain Entity Hierarchy

The FinTrack core domain models personal banking entities hierarchically:

```
[User / Profile]
      │ 1:N
      ▼
   [Bank] (e.g., HDFC Bank, ICICI Bank)
      │ 1:N
      ▼
  [Account] (e.g., Salary Account, Savings, Credit Card)
      │ 1:N
      ├──────────────────────────────┐
      ▼                              ▼
[Transaction] ◄────────────── [ImportBatch]
      │ N:1                          ▲
      ▼                              │ 1:N
  [Category] (Income/Expense)   [Uploaded File]
```

### 1.1. Core Domain Entities

1. **Profile (`profiles`)**:
   * Extends Supabase `auth.users`. Stores user preferences (base currency, date format, display preferences).
2. **Bank (`banks`)**:
   * Represents an institutional entity (e.g., HDFC, ICICI, SBI, Chase).
   * Belongs directly to a user.
3. **Account (`accounts`)**:
   * Belongs to a single Bank.
   * Attributes: Account name, Account Type (`SAVINGS`, `CURRENT`, `SALARY`, `CREDIT_CARD`, `CASH`, `OTHER`), Base Currency (ISO 4217, e.g., `INR`, `USD`), Opening Balance, Active flag.
4. **Category (`categories`)**:
   * Self-referencing tree or parent-child hierarchy.
   * Types: `INCOME`, `EXPENSE`.
   * Status: `is_archived` boolean. If a category has historical transactions, it cannot be deleted from the database; it is marked archived so it no longer appears in form pickers while preserving historical reporting integrity.
5. **Transaction (`transactions`)**:
   * The fundamental financial record.
   * Belongs to an `Account`. (Note: `bank_id` is intentionally omitted from `transactions` to avoid denormalized redundancy, as `account_id -> bank_id` provides guaranteed normalization).
   * References an optional `Category` and an optional `ImportBatch`.
6. **Import Batch (`import_batches`)**:
   * Represents a single file ingestion session.
   * Tracks original filename, file hash, account ID, total row count, imported count, duplicate count, and imported timestamp.
   * Enables complete **batch rollback** (deleting a batch cascades to delete all transactions introduced by that batch).
7. **Categorization Rule (`categorization_rules`)**:
   * Heuristic rule matching narration keywords or regex patterns to automatically assign categories during import or manual entry.

---

## 2. Bank Statement vs. Application Domain Model Transformation

### 2.1. Original Bank Statement Columns (Source)
Traditional bank statements represent ledger activity as:
```text
Date | Transaction Description (Narration) | Currency | Deposit | Withdrawal | Running Balance
```

### 2.2. Application Domain Model (Destination)
FinTrack normalizes this into:
```text
date:                 DATE (YYYY-MM-DD)
account_id:           UUID (FK -> accounts.id)
category_id:          UUID (FK -> categories.id, NULLABLE)
description:          TEXT (Cleaned transaction narration)
amount:               NUMERIC(12,2) (Always positive magnitude: e.g., 450.00)
transaction_type:     ENUM ('INCOME', 'EXPENSE', 'TRANSFER')
deposit:              NUMERIC(12,2) (Derived or imported credit amount)
withdrawal:           NUMERIC(12,2) (Derived or imported debit amount)
running_balance:      NUMERIC(12,2) (Statement balance after transaction)
currency:             VARCHAR(3) (e.g., 'INR')
notes:                TEXT (User-entered memo or annotations)
import_batch_id:      UUID (FK -> import_batches.id, NULLABLE)
```

### 2.3. Transformation Logic

#### During Bank Statement Import:
```typescript
function transformStatementRow(row: StatementRowInput, defaultCurrency: string): NormalizedTransactionDraft {
  const deposit = parseNumeric(row.deposit);
  const withdrawal = parseNumeric(row.withdrawal);
  const runningBalance = parseNumeric(row.runningBalance);

  let type: 'INCOME' | 'EXPENSE';
  let amount: number;

  if (deposit > 0 && withdrawal === 0) {
    type = 'INCOME';
    amount = deposit;
  } else if (withdrawal > 0 && deposit === 0) {
    type = 'EXPENSE';
    amount = withdrawal;
  } else if (deposit > 0 && withdrawal > 0) {
    // Edge case: net difference
    type = deposit >= withdrawal ? 'INCOME' : 'EXPENSE';
    amount = Math.abs(deposit - withdrawal);
  } else {
    // Fallback: 0 amount transaction or charge
    type = 'EXPENSE';
    amount = 0;
  }

  return {
    date: parseStandardDate(row.date),
    description: sanitizeNarration(row.transaction),
    currency: row.currency || defaultCurrency,
    amount,
    transaction_type: type,
    deposit,
    withdrawal,
    running_balance: runningBalance,
  };
}
```

#### During Manual Transaction Entry:
Users enter: `Transaction Type`, `Amount` (positive), `Account`, `Date`, `Category`, `Description`.
The system computes the statement-compatible fields:
* If `transaction_type === 'INCOME'`: `deposit = amount`, `withdrawal = 0.00`.
* If `transaction_type === 'EXPENSE'`: `withdrawal = amount`, `deposit = 0.00`.
* If `transaction_type === 'TRANSFER'`: Source transaction has `withdrawal = amount`, `deposit = 0.00`. Target transaction has `deposit = amount`, `withdrawal = 0.00`.

This duality guarantees that manual entries can be exported back into standard statement formats without loss of parity.

---

## 3. Internal Transfer Architecture

A critical flaw in naive personal finance trackers is treating a transfer from Account A to Account B as an Expense in A and Income in B, distorting user cash flow.

FinTrack resolves this via **Paired Transfer Records**:
1. When a transfer of ₹10,000 is made from `HDFC Savings` to `ICICI Savings`:
   * **Source Record**:
     * `account_id`: HDFC Savings
     * `transaction_type`: `TRANSFER`
     * `amount`: 10000.00
     * `withdrawal`: 10000.00, `deposit`: 0.00
     * `transfer_account_id`: ICICI Savings
     * `transfer_pair_id`: UUID pointing to Target Record
   * **Destination Record**:
     * `account_id`: ICICI Savings
     * `transaction_type`: `TRANSFER`
     * `amount`: 10000.00
     * `deposit`: 10000.00, `withdrawal`: 0.00
     * `transfer_account_id`: HDFC Savings
     * `transfer_pair_id`: UUID pointing to Source Record
2. **Why Paired Records?**:
   * Each account maintains its independent running balance and statement history.
   * Supports transfers where clearance dates differ (e.g., initiated Sept 1, cleared Sept 2).
   * **Analytics Isolation**: All financial aggregate queries filter out `transaction_type = 'TRANSFER'` when computing total user Income, Expenses, and Net Savings.

---

## 4. Monetary Representation & Precision

* **Database Type**: `NUMERIC(12,2)`.
  * Allows values up to $999,999,999.99 (999 million), sufficient for personal finance.
  * Prevents IEEE 754 floating-point inaccuracies (e.g., `0.1 + 0.2 = 0.30000000000000004`).
* **Frontend Handling**:
  * Monetary inputs are parsed via clean string manipulation or integer cents.
  * Display formatting uses `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

