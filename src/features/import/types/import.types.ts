export type TargetField =
  | 'date'
  | 'description'
  | 'deposit'
  | 'withdrawal'
  | 'running_balance'
  | 'currency'
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
  isDuplicate: boolean;
  skipImport: boolean;
}

export interface ImportBatchResult {
  batchId: string;
  totalRows: number;
  importedRows: number;
  skippedDuplicates: number;
}

