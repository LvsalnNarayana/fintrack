import { supabase, isSupabaseConfigured, getAuthenticatedUserId } from '@/lib/supabase/client';
import { ParsedStatementRow, ImportBatchResult } from '../types/import.types';
import { Account, ImportBatch, TransactionType } from '@/types/domain.types';
import { transactionService } from '@/features/transactions/services/transactionService';
import { categoryService } from '@/features/categories/services/categoryService';
import { accountService } from '@/features/accounts/services/accountService';

const resolveRowTypeAndAmount = (row: ParsedStatementRow): {
  type: TransactionType;
  amount: number;
  deposit: number;
  withdrawal: number;
} => {
  const type: TransactionType =
    row.transactionType ||
    (row.deposit > 0 && row.withdrawal <= 0 ? 'INCOME' : 'EXPENSE');

  const amount = row.amount && row.amount > 0
    ? row.amount
    : row.deposit > 0
      ? row.deposit
      : row.withdrawal;

  // Prefer explicit Deposit/Withdrawal from FinTrack export when present
  if (row.deposit > 0 || row.withdrawal > 0) {
    return {
      type,
      amount: amount || (row.deposit > 0 ? row.deposit : row.withdrawal),
      deposit: row.deposit,
      withdrawal: row.withdrawal,
    };
  }

  return {
    type,
    amount,
    deposit: type === 'INCOME' ? amount : 0,
    withdrawal: type !== 'INCOME' ? amount : 0,
  };
};

const resolveAccountId = (
  accounts: Account[],
  fallbackAccountId: string,
  accountName?: string | null,
  bankName?: string | null
): string => {
  if (!accountName) return fallbackAccountId;

  const normalizedAccount = accountName.toLowerCase().trim();
  const normalizedBank = bankName?.toLowerCase().trim();

  const exact = accounts.find((acc) => {
    const nameMatch = acc.name.toLowerCase().trim() === normalizedAccount;
    if (!nameMatch) return false;
    if (!normalizedBank) return true;
    return (acc.bankName || '').toLowerCase().trim() === normalizedBank;
  });
  if (exact) return exact.id;

  const byName = accounts.find((acc) => acc.name.toLowerCase().trim() === normalizedAccount);
  return byName?.id || fallbackAccountId;
};

export const importService = {
  async detectDuplicates(
    rows: ParsedStatementRow[],
    accountId: string
  ): Promise<ParsedStatementRow[]> {
    const accounts = await accountService.getAccounts(true);

    if (!isSupabaseConfigured()) {
      const existing = await transactionService.getTransactions({ pageSize: 2000 });

      return rows.map((row) => {
        const { amount } = resolveRowTypeAndAmount(row);
        const rowAccountId = resolveAccountId(accounts, accountId, row.accountName, row.bankName);
        const isDup = existing.data.some((tx) => {
          return (
            tx.accountId === rowAccountId &&
            tx.date === row.date &&
            Math.abs(tx.amount - amount) < 0.01 &&
            tx.description.toLowerCase().trim() === row.description.toLowerCase().trim()
          );
        });

        return {
          ...row,
          isDuplicate: isDup,
          skipImport: isDup,
        };
      });
    }

    const dates = Array.from(new Set(rows.map((r) => r.date)));
    const { data: existing } = await supabase
      .from('transactions')
      .select('account_id, date, amount, description')
      .in('date', dates);

    const existingSet = new Set(
      (existing || []).map(
        (e) => `${e.account_id}|${e.date}|${Number(e.amount)}|${e.description.toLowerCase().trim()}`
      )
    );

    return rows.map((row) => {
      const { amount } = resolveRowTypeAndAmount(row);
      const rowAccountId = resolveAccountId(accounts, accountId, row.accountName, row.bankName);
      const key = `${rowAccountId}|${row.date}|${amount}|${row.description.toLowerCase().trim()}`;
      const isDup = existingSet.has(key);

      return {
        ...row,
        isDuplicate: isDup,
        skipImport: isDup,
      };
    });
  },

  async commitImport(
    accountId: string,
    fileName: string,
    rows: ParsedStatementRow[]
  ): Promise<ImportBatchResult> {
    const importableRows = rows.filter((r) => !r.skipImport);
    const skippedCount = rows.length - importableRows.length;

    const [categories, accounts] = await Promise.all([
      categoryService.getCategories(true),
      accountService.getAccounts(true),
    ]);

    const categoryByName = new Map(
      categories.map((cat) => [cat.name.toLowerCase().trim(), cat])
    );

    const resolveCategoryId = (categoryName?: string | null, type?: TransactionType): string | null => {
      if (!categoryName) return null;
      const match = categoryByName.get(categoryName.toLowerCase().trim());
      if (!match) return null;
      if (type && type !== 'TRANSFER' && match.type !== type) return null;
      return match.id;
    };

    if (!isSupabaseConfigured()) {
      for (const row of [...importableRows].reverse()) {
        const { type, amount } = resolveRowTypeAndAmount(row);
        const rowAccountId = resolveAccountId(accounts, accountId, row.accountName, row.bankName);

        await transactionService.createTransaction({
          accountId: rowAccountId,
          date: row.date,
          description: row.description,
          amount,
          transactionType: type,
          currency: row.currency,
          categoryId: resolveCategoryId(row.categoryName, type),
          notes: row.notes || null,
        });
      }

      return {
        batchId: `batch-mock-${Date.now()}`,
        totalRows: rows.length,
        importedRows: importableRows.length,
        skippedDuplicates: skippedCount,
      };
    }

    const userId = await getAuthenticatedUserId();

    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
        user_id: userId,
        account_id: accountId,
        source_file_name: fileName,
        source_file_hash: `hash-${Date.now()}`,
        total_rows: rows.length,
        imported_rows: importableRows.length,
        skipped_duplicates: skippedCount,
      })
      .select()
      .single();

    if (batchError) throw batchError;

    const { data: rules } = await supabase
      .from('categorization_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    const txRecords = importableRows.map((row, index) => {
      const { type, amount, deposit, withdrawal } = resolveRowTypeAndAmount(row);
      const rowAccountId = resolveAccountId(accounts, accountId, row.accountName, row.bankName);

      let categoryId = resolveCategoryId(row.categoryName, type);

      if (!categoryId && rules) {
        const descLower = row.description.toLowerCase();
        for (const rule of rules) {
          if (descLower.includes(rule.keyword.toLowerCase())) {
            categoryId = rule.category_id;
            break;
          }
        }
      }

      return {
        user_id: userId,
        account_id: rowAccountId,
        import_batch_id: batch.id,
        import_row_number: index + 1,
        category_id: categoryId,
        date: row.date,
        order_date: row.date.slice(0, 10),
        description: row.description,
        amount,
        transaction_type: type,
        deposit,
        withdrawal,
        running_balance: row.runningBalance,
        currency: row.currency,
        notes: row.notes || null,
      };
    });

    if (txRecords.length > 0) {
      const { error: txError } = await supabase.from('transactions').insert(txRecords);
      if (txError) throw txError;
    }

    return {
      batchId: batch.id,
      totalRows: rows.length,
      importedRows: importableRows.length,
      skippedDuplicates: skippedCount,
    };
  },

  async getImportBatches(): Promise<ImportBatch[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('import_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((b) => ({
      id: b.id,
      userId: b.user_id,
      accountId: b.account_id,
      sourceFileName: b.source_file_name,
      sourceFileHash: b.source_file_hash,
      totalRows: b.total_rows,
      importedRows: b.imported_rows,
      skippedDuplicates: b.skipped_duplicates,
      createdAt: b.created_at,
    }));
  },

  async rollbackBatch(batchId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase.from('import_batches').delete().eq('id', batchId);
    if (error) throw error;
  },
};
