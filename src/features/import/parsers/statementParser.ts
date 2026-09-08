import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ColumnMapping, ParsedStatementRow } from '../types/import.types';
import { parseNumericAmount } from '@/lib/utils/currency';

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

  return rows.map((raw) => {
    const rawDate = dateHeader ? String(raw[dateHeader] || '') : '';
    const rawDesc = descHeader ? String(raw[descHeader] || '') : '';
    const deposit = depositHeader ? parseNumericAmount(raw[depositHeader]) : 0;
    const withdrawal = withdrawalHeader ? parseNumericAmount(raw[withdrawalHeader]) : 0;
    const runningBalance = balanceHeader && raw[balanceHeader] !== '' ? parseNumericAmount(raw[balanceHeader]) : null;
    const currency = currencyHeader && raw[currencyHeader] ? String(raw[currencyHeader]) : defaultCurrency;

    return {
      raw,
      date: sanitizeDateString(rawDate),
      description: rawDesc.trim(),
      deposit,
      withdrawal,
      runningBalance,
      currency,
      isDuplicate: false,
      skipImport: false,
    };
  });
};

const sanitizeDateString = (rawDate: string): string => {
  if (!rawDate) return new Date().toISOString().split('T')[0];

  // Keep the date portion from ISO date-time values while accepting the time for ordering.
  if (/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(rawDate)) {
    return rawDate;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = rawDate.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length === 2 && parts[2].length === 4) {
      // DD/MM/YYYY
      const datePart = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      return datePart;
    }
  }

  return rawDate;
};

