import Papa from 'papaparse';
import { format } from 'date-fns';
import { Transaction } from '@/types/domain.types';

export const buildTransactionsCsv = (transactions: Transaction[]): string => {
  const rows = transactions.map((tx) => ({
    Date: tx.date,
    Description: tx.description,
    Type: tx.transactionType,
    Amount: tx.amount,
    Deposit: tx.deposit,
    Withdrawal: tx.withdrawal,
    Category: tx.categoryName || '',
    Account: tx.accountName || '',
    Bank: tx.bankName || '',
    Currency: tx.currency,
    'Running Balance': tx.runningBalance ?? '',
    Notes: tx.notes || '',
  }));

  return Papa.unparse(rows, {
    quotes: true,
    header: true,
  });
};

export const downloadTransactionsCsv = (
  transactions: Transaction[],
  filenamePrefix = 'fintrack-transactions'
): void => {
  const csv = buildTransactionsCsv(transactions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = format(new Date(), 'yyyyMMdd-HHmmss');
  link.href = url;
  link.download = `${filenamePrefix}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
