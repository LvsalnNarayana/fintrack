# Import Pipeline & Duplicate Detection: FinTrack PWA

## 1. Import Workflow Architecture

The statement ingestion engine provides a guided 4-step progressive disclosure pipeline designed to handle varying bank formats without rigid assumptions:

```
[ Step 1: Upload ]
  ├── File validation (.csv, .xlsx, .xls)
  └── Target Bank & Account selection
        │
        ▼
[ Step 2: Detection & Mapping ]
  ├── Client-side header normalization
  ├── Synonym dictionary fuzzy match
  └── Interactive mapping overrides
        │
        ▼
[ Step 3: Validation & Deduplication ]
  ├── Date, numeric, and balance sanitization
  ├── Composite duplicate detection against DB
  └── Interactive resolution ([Skip] vs [Import Anyway])
        │
        ▼
[ Step 4: Batch Ingestion & Auto-Categorization ]
  ├── Rule engine execution (Keyword matching)
  ├── Atomic Supabase batch insert
  └── Batch summary & rollback capability
```

---

## 2. Header Auto-Detection & Synonym Dictionaries

Different banks name statement columns differently. FinTrack cleans raw headers (`toLowerCase().trim().replace(/[^a-z0-9]/g, '')`) and matches them against a weighted dictionary:

| Target Domain Field | Common Bank Column Synonyms |
| :--- | :--- |
| `date` | `date`, `txndate`, `transactiondate`, `valuedate`, `postingdate`, `bookingdate` |
| `description` | `narration`, `transaction`, `description`, `particulars`, `remarks`, `details`, `memo`, `notes` |
| `deposit` | `deposit`, `credit`, `cr`, `depositamt`, `amountcredited`, `deposits` |
| `withdrawal` | `withdrawal`, `debit`, `dr`, `withdrawalamt`, `amountdebited`, `withdrawals` |
| `running_balance` | `balance`, `runningbalance`, `closingbalance`, `availablebalance`, `netbalance`, `balanceinr` |
| `currency` | `currency`, `curr`, `ccy` |

If a column cannot be matched with high confidence ($\ge 80\%$), the column mapping dropdown defaults to `Unmapped (Ignore)`.

---

## 3. Data Cleaning & Normalization

1. **Date Parsing**:
   * Analyzes date strings across common Indian and international formats: `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`, `DD-MMM-YYYY` (e.g., `06-Sep-2026`).
   * Normalizes all values into standard ISO 8601 `YYYY-MM-DD`.
2. **Monetary Sanitization**:
   * Strips thousand separators (both standard `100,000.00` and Indian numbering system `1,00,000.00`).
   * Strips currency symbols (`₹`, `$`, `€`, `INR`).
   * Ensures positive magnitudes for deposit and withdrawal fields.
3. **Narration Cleaning**:
   * Trims whitespace and collapses multiple spaces.
   * Strips bank noise prefixes while preserving the merchant identifier.

---

## 4. Duplicate Detection Algorithm

A naive description check fails because users make recurring transactions to the same merchant (e.g., Swiggy multiple times in a week). 

FinTrack uses a **Composite Match Heuristic**:

$$\text{Duplicate Match} \iff \begin{cases} 
\text{account\_id}_{\text{incoming}} = \text{account\_id}_{\text{existing}} \\
\text{date}_{\text{incoming}} = \text{date}_{\text{existing}} \\
\text{amount}_{\text{incoming}} = \text{amount}_{\text{existing}} \\
\text{transaction\_type}_{\text{incoming}} = \text{transaction\_type}_{\text{existing}} \\
\text{normalized\_narration}(\text{desc}_{\text{incoming}}) \approx \text{normalized\_narration}(\text{desc}_{\text{existing}})
\end{cases}$$

### Narration Normalization for Deduplication:
1. Strip payment reference numbers (e.g., `UPI/3245918234/SWIGGY` $\to$ `SWIGGY`).
2. Strip non-alphanumeric characters and lowercase string.
3. If account, date, amount, and normalized narration match an existing database record, the row is flagged as `POSSIBLE_DUPLICATE`.
4. The user interface highlights duplicate candidates with a warning badge and sets the default action to `Skip`. Users can manually toggle to `Import Anyway`.

---

## 5. Import Batch & Rollback Strategy

Every import session generates an `import_batches` record:

```typescript
interface ImportBatch {
  id: string;
  user_id: string;
  account_id: string;
  source_file_name: string;
  source_file_hash: string;       // SHA-256 to prevent re-uploading identical file
  total_rows: number;
  imported_rows: number;
  skipped_duplicates: number;
  created_at: string;
}
```

Every imported transaction stores `import_batch_id = import_batches.id`.

### Rollback (Undo Import):
If a user imports a statement under the wrong account or with bad column mappings, they can navigate to **Settings $\to$ Import History** and click **Rollback Batch**.
Because the foreign key is configured with `ON DELETE CASCADE`:
```sql
DELETE FROM import_batches WHERE id = $1;
```
All transactions created by that import are deleted atomically in a single operation without leaving orphaned records.

---

## 6. Automatic Categorization Engine

Before inserting imported transactions into the ledger, FinTrack runs each transaction description through active `categorization_rules` ordered by `priority ASC`:

```typescript
export function applyCategorizationRules(
  description: string,
  rules: CategorizationRule[]
): string | null {
  const normalizedText = description.toLowerCase();

  for (const rule of rules) {
    if (!rule.is_active) continue;

    if (rule.match_type === 'EXACT' && normalizedText === rule.keyword.toLowerCase()) {
      return rule.category_id;
    }
    if (rule.match_type === 'CONTAINS' && normalizedText.includes(rule.keyword.toLowerCase())) {
      return rule.category_id;
    }
    if (rule.match_type === 'REGEX') {
      try {
        const regex = new RegExp(rule.keyword, 'i');
        if (regex.test(description)) return rule.category_id;
      } catch (e) {
        console.warn(`Invalid regex pattern in rule: ${rule.id}`);
      }
    }
  }

  return null; // Uncategorized if no rule matches
}
```
Transactions that do not match any rule are inserted with `category_id = NULL` ("Uncategorized"), prompting the user to assign them later.

