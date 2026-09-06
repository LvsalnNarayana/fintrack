import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { ParsedStatementRow, ImportBatchResult } from '../types/import.types';
import { ImportBatch } from '@/types/domain.types';
import { transactionService } from '@/features/transactions/services/transactionService';

export const importService = {
  async detectDuplicates(
    rows: ParsedStatementRow[],
    accountId: string
  ): Promise<ParsedStatementRow[]> {
    if (!isSupabaseConfigured()) {
      // In demo mode, check against mock transactions
      const existing = await transactionService.getTransactions({ accountId, pageSize: 500 });

      return rows.map((row) => {
        const isDup = existing.data.some((tx) => {
          const amount = row.deposit > 0 ? row.deposit : row.withdrawal;
          return (
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

    // Check against Supabase transactions
    const dates = Array.from(new Set(rows.map((r) => r.date)));
    const { data: existing } = await supabase
      .from('transactions')
      .select('date, amount, description')
      .eq('account_id', accountId)
      .in('date', dates);

    const existingSet = new Set(
      (existing || []).map((e) => `${e.date}|${Number(e.amount)}|${e.description.toLowerCase().trim()}`)
    );

    return rows.map((row) => {
      const amount = row.deposit > 0 ? row.deposit : row.withdrawal;
      const key = `${row.date}|${amount}|${row.description.toLowerCase().trim()}`;
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

    if (!isSupabaseConfigured()) {
      // Demo mode insertion
      for (const row of importableRows) {
        const type = row.deposit > 0 ? 'INCOME' : 'EXPENSE';
        const amount = row.deposit > 0 ? row.deposit : row.withdrawal;

        await transactionService.createTransaction({
          accountId,
          date: row.date,
          description: row.description,
          amount,
          transactionType: type,
          currency: row.currency,
        });
      }

      return {
        batchId: `batch-mock-${Date.now()}`,
        totalRows: rows.length,
        importedRows: importableRows.length,
        skippedDuplicates: skippedCount,
      };
    }

    // 1. Create import batch record
    const { data: batch, error: batchError } = await supabase
      .from('import_batches')
      .insert({
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

    // 2. Fetch active rules for auto-categorization
    const { data: rules } = await supabase
      .from('categorization_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    // 3. Prepare transaction rows
    const txRecords = importableRows.map((row) => {
      const type = row.deposit > 0 ? 'INCOME' : 'EXPENSE';
      const amount = row.deposit > 0 ? row.deposit : row.withdrawal;

      // Auto-assign category
      let categoryId: string | null = null;
      if (rules) {
        const descLower = row.description.toLowerCase();
        for (const rule of rules) {
          if (descLower.includes(rule.keyword.toLowerCase())) {
            categoryId = rule.category_id;
            break;
          }
        }
      }

      return {
        account_id: accountId,
        import_batch_id: batch.id,
        category_id: categoryId,
        date: row.date,
        description: row.description,
        amount,
        transaction_type: type,
        deposit: row.deposit,
        withdrawal: row.withdrawal,
        running_balance: row.runningBalance,
        currency: row.currency,
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

    // With ON DELETE CASCADE, deleting batch purges associated transactions
    const { error } = await supabase.from('import_batches').delete().eq('id', batchId);
    if (error) throw error;
  },
};

