import { TargetField, ColumnMapping, ImportFormatType } from '../types/import.types';

const BANK_SYNONYMS: Record<Exclude<TargetField, 'ignore'>, string[]> = {
  date: ['date', 'txndate', 'transactiondate', 'valuedate', 'postingdate', 'bookingdate'],
  description: ['narration', 'transaction', 'description', 'particulars', 'remarks', 'details', 'memo'],
  deposit: ['deposit', 'credit', 'cr', 'depositamt', 'amountcredited', 'deposits'],
  withdrawal: ['withdrawal', 'debit', 'dr', 'withdrawalamt', 'amountdebited', 'withdrawals'],
  running_balance: ['balance', 'runningbalance', 'closingbalance', 'availablebalance', 'netbalance', 'balanceinr'],
  currency: ['currency', 'curr', 'ccy'],
  type: ['type', 'transactiontype', 'txntype', 'drcr'],
  amount: ['amount', 'txnamount', 'transactionamount'],
  category: ['category', 'categoryname'],
  notes: ['notes', 'note', 'comment', 'comments'],
  account: ['account', 'accountname', 'accounttitle'],
  bank: ['bank', 'bankname', 'institution'],
};

/**
 * Exact FinTrack export headers after normalization:
 * Date, Description, Type, Amount, Deposit, Withdrawal, Category,
 * Account, Bank, Currency, Running Balance, Notes
 */
const FINTRACK_EXPORT_EXACT: Record<string, TargetField> = {
  date: 'date',
  description: 'description',
  type: 'type',
  amount: 'amount',
  deposit: 'deposit',
  withdrawal: 'withdrawal',
  category: 'category',
  account: 'account',
  bank: 'bank',
  currency: 'currency',
  runningbalance: 'running_balance',
  notes: 'notes',
};

const cleanHeader = (rawHeader: string): string =>
  rawHeader.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

export const looksLikeFinTrackExport = (headers: string[]): boolean => {
  const cleaned = new Set(headers.map(cleanHeader));
  const required = ['date', 'description', 'type', 'amount', 'deposit', 'withdrawal'];
  const expected = [
    'category',
    'account',
    'bank',
    'currency',
    'runningbalance',
    'notes',
  ];
  const hasRequired = required.every((key) => cleaned.has(key));
  const softHits = expected.filter((key) => cleaned.has(key)).length;
  return hasRequired && softHits >= 2;
};

export const detectColumnMapping = (
  headers: string[],
  format: ImportFormatType = 'bank_statement'
): ColumnMapping[] => {
  if (format === 'fintrack_export') {
    return headers.map((rawHeader) => {
      const cleaned = cleanHeader(rawHeader);
      const exact = FINTRACK_EXPORT_EXACT[cleaned];
      if (exact) {
        return {
          originalHeader: rawHeader,
          targetField: exact,
          confidence: 1.0,
        };
      }
      return {
        originalHeader: rawHeader,
        targetField: 'ignore' as TargetField,
        confidence: 0,
      };
    });
  }

  return headers.map((rawHeader) => {
    const cleaned = cleanHeader(rawHeader);

    let bestMatch: TargetField = 'ignore';
    let highestConfidence = 0;

    for (const [field, syns] of Object.entries(BANK_SYNONYMS) as [Exclude<TargetField, 'ignore'>, string[]][]) {
      if (syns.includes(cleaned)) {
        bestMatch = field;
        highestConfidence = 1.0;
        break;
      }

      for (const syn of syns) {
        if (cleaned.includes(syn) || syn.includes(cleaned)) {
          if (highestConfidence < 0.7) {
            bestMatch = field;
            highestConfidence = 0.7;
          }
        }
      }
    }

    return {
      originalHeader: rawHeader,
      targetField: bestMatch,
      confidence: highestConfidence,
    };
  });
};
