export type ImportFormatType = 'bank_statement' | 'fintrack_export';

export type TargetField =
  | 'date'
  | 'description'
  | 'deposit'
  | 'withdrawal'
  | 'running_balance'
  | 'currency'
  | 'type'
  | 'amount'
  | 'category'
  | 'notes'
  | 'account'
  | 'bank'
  | 'ignore';

/** Exact column headers written by FinTrack CSV export. */
export const FINTRACK_EXPORT_HEADERS = [
  'Date',
  'Description',
  'Type',
  'Amount',
  'Deposit',
  'Withdrawal',
  'Category',
  'Account',
  'Bank',
  'Currency',
  'Running Balance',
  'Notes',
] as const;

export interface ColumnMapping {
  originalHeader: string;
  targetField: TargetField;
  confidence: number;
}

export interface ParsedStatementRow {
  raw: Record<string, string | number>;
  date: string;
  description: string;
  deposit: number;
  withdrawal: number;
  runningBalance: number | null;
  currency: string;
  transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount?: number;
  categoryName?: string | null;
  notes?: string | null;
  accountName?: string | null;
  bankName?: string | null;
  isDuplicate: boolean;
  skipImport: boolean;
}

export interface ImportBatchResult {
  batchId: string;
  totalRows: number;
  importedRows: number;
  skippedDuplicates: number;
}

export const IMPORT_FORMAT_OPTIONS: Array<{
  value: ImportFormatType;
  label: string;
  description: string;
}> = [
  {
    value: 'bank_statement',
    label: 'Bank statement',
    description: 'CSV/Excel from your bank (Date, Narration, Deposit, Withdrawal, Balance)',
  },
  {
    value: 'fintrack_export',
    label: 'FinTrack export',
    description:
      'CSV from Transactions → Export CSV (Date, Description, Type, Amount, Deposit, Withdrawal, Category, Account, Bank, Currency, Running Balance, Notes)',
  },
];
