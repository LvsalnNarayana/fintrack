import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ColumnMapping, ParsedStatementRow } from '../types/import.types';
import { parseNumericAmount } from '@/lib/utils/currency';
import { TransactionType } from '@/types/domain.types';

export interface RawParseResult {
  headers: string[];
  rows: Record<string, any>[];
  fileName: string;
}

export const parseFileContent = async (file: File): Promise<RawParseResult> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          resolve({
            headers,
            rows: results.data as Record<string, any>[],
            fileName: file.name,
          });
        },
        error: (err) => reject(err),
      });
    });
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (jsonData.length === 0) {
      return { headers: [], rows: [], fileName: file.name };
    }

    const headers = Object.keys(jsonData[0]);
    return {
      headers,
      rows: jsonData,
      fileName: file.name,
    };
  }

  throw new Error(`Unsupported file format .${extension}. Please upload .csv or .xlsx.`);
};

const parseTransactionType = (raw: string): TransactionType | undefined => {
  const normalized = raw.trim().toUpperCase();
  if (normalized === 'INCOME' || normalized === 'CREDIT' || normalized === 'CR') return 'INCOME';
  if (normalized === 'EXPENSE' || normalized === 'DEBIT' || normalized === 'DR') return 'EXPENSE';
  if (normalized === 'TRANSFER') return 'TRANSFER';
  return undefined;
};

export const transformRowsWithMapping = (
  rows: Record<string, any>[],
  mappings: ColumnMapping[],
  defaultCurrency = 'INR'
): ParsedStatementRow[] => {
  const dateHeader = mappings.find((m) => m.targetField === 'date')?.originalHeader;
  const descHeader = mappings.find((m) => m.targetField === 'description')?.originalHeader;
  const depositHeader = mappings.find((m) => m.targetField === 'deposit')?.originalHeader;
  const withdrawalHeader = mappings.find((m) => m.targetField === 'withdrawal')?.originalHeader;
  const balanceHeader = mappings.find((m) => m.targetField === 'running_balance')?.originalHeader;
  const currencyHeader = mappings.find((m) => m.targetField === 'currency')?.originalHeader;
  const typeHeader = mappings.find((m) => m.targetField === 'type')?.originalHeader;
  const amountHeader = mappings.find((m) => m.targetField === 'amount')?.originalHeader;
  const categoryHeader = mappings.find((m) => m.targetField === 'category')?.originalHeader;
  const notesHeader = mappings.find((m) => m.targetField === 'notes')?.originalHeader;
  const accountHeader = mappings.find((m) => m.targetField === 'account')?.originalHeader;
  const bankHeader = mappings.find((m) => m.targetField === 'bank')?.originalHeader;

  return rows.map((raw) => {
    const rawDate = dateHeader ? String(raw[dateHeader] || '') : '';
    const rawDesc = descHeader ? String(raw[descHeader] || '') : '';
    let deposit = depositHeader ? parseNumericAmount(raw[depositHeader]) : 0;
    let withdrawal = withdrawalHeader ? parseNumericAmount(raw[withdrawalHeader]) : 0;
    const runningBalance = balanceHeader && raw[balanceHeader] !== ''
      ? parseNumericAmount(raw[balanceHeader])
      : null;
    const currency = currencyHeader && raw[currencyHeader]
      ? String(raw[currencyHeader]).trim() || defaultCurrency
      : defaultCurrency;
    const categoryName = categoryHeader
      ? String(raw[categoryHeader] || '').trim() || null
      : null;
    const notes = notesHeader
      ? String(raw[notesHeader] || '').trim() || null
      : null;
    const accountName = accountHeader
      ? String(raw[accountHeader] || '').trim() || null
      : null;
    const bankName = bankHeader
      ? String(raw[bankHeader] || '').trim() || null
      : null;

    const explicitType = typeHeader
      ? parseTransactionType(String(raw[typeHeader] || ''))
      : undefined;
    const amountFromColumn = amountHeader ? parseNumericAmount(raw[amountHeader]) : 0;

    // Prefer Deposit/Withdrawal from file; fill from Amount + Type only when both are empty
    if (deposit === 0 && withdrawal === 0 && amountFromColumn > 0) {
      if (explicitType === 'INCOME') {
        deposit = amountFromColumn;
      } else {
        withdrawal = amountFromColumn;
      }
    }

    let transactionType = explicitType;
    if (!transactionType) {
      if (deposit > 0 && withdrawal <= 0) transactionType = 'INCOME';
      else if (withdrawal > 0) transactionType = 'EXPENSE';
    }

    const amount = amountFromColumn > 0
      ? amountFromColumn
      : deposit > 0
        ? deposit
        : withdrawal;

    return {
      raw,
      date: sanitizeDateString(rawDate),
      description: rawDesc.trim(),
      deposit,
      withdrawal,
      runningBalance,
      currency,
      transactionType,
      amount,
      categoryName,
      notes,
      accountName,
      bankName,
      isDuplicate: false,
      skipImport: false,
    };
  });
};

const sanitizeDateString = (rawDate: string): string => {
  if (!rawDate) return new Date().toISOString().split('T')[0];

  if (/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(rawDate)) {
    return rawDate.slice(0, 10);
  }

  const parts = rawDate.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  return rawDate;
};
