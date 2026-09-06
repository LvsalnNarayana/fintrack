import { TargetField, ColumnMapping } from '../types/import.types';

const SYNONYMS: Record<TargetField, string[]> = {
  date: ['date', 'txndate', 'transactiondate', 'valuedate', 'postingdate', 'bookingdate'],
  description: ['narration', 'transaction', 'description', 'particulars', 'remarks', 'details', 'memo', 'notes'],
  deposit: ['deposit', 'credit', 'cr', 'depositamt', 'amountcredited', 'deposits'],
  withdrawal: ['withdrawal', 'debit', 'dr', 'withdrawalamt', 'amountdebited', 'withdrawals'],
  running_balance: ['balance', 'runningbalance', 'closingbalance', 'availablebalance', 'netbalance', 'balanceinr'],
  currency: ['currency', 'curr', 'ccy'],
  ignore: [],
};

export const detectColumnMapping = (headers: string[]): ColumnMapping[] => {
  return headers.map((rawHeader) => {
    const cleaned = rawHeader.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

    let bestMatch: TargetField = 'ignore';
    let highestConfidence = 0;

    for (const [field, syns] of Object.entries(SYNONYMS) as [TargetField, string[]][]) {
      if (syns.includes(cleaned)) {
        bestMatch = field;
        highestConfidence = 1.0;
        break;
      }

      // Substring matching
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

