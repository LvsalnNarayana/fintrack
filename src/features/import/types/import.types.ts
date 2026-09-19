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
  | 'ignore';

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
    description: 'CSV downloaded from FinTrack (includes Type, Category, Notes, edited Description)',
  },
];
