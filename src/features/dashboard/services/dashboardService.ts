import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DashboardSummary, CategorySpendingItem } from '@/types/domain.types';
import { transactionService } from '@/features/transactions/services/transactionService';

export const dashboardService = {
  async getSummary(startDate: string, endDate: string, accountId?: string): Promise<DashboardSummary> {
    if (!isSupabaseConfigured()) {
      // In demo mode, derive from mock transactions
      const res = await transactionService.getTransactions({ startDate, endDate, accountId, pageSize: 500 });
      let income = 0;
      let expense = 0;
      let latestBal = 61270;

      for (const t of res.data) {
        if (t.transactionType === 'INCOME') income += t.amount;
        if (t.transactionType === 'EXPENSE') expense += t.amount;
      }

      return {
        income,
        expense,
        netFlow: income - expense,
        currentBalance: latestBal,
      };
    }

    const { data, error } = await supabase.rpc('get_dashboard_summary', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_account_id: accountId || null,
    });

    if (error) throw error;

    return {
      income: Number(data?.income || 0),
      expense: Number(data?.expense || 0),
      netFlow: Number(data?.net_flow || 0),
      currentBalance: Number(data?.current_balance || 0),
    };
  },

  async getTopCategories(startDate: string, endDate: string, accountId?: string): Promise<CategorySpendingItem[]> {
    if (!isSupabaseConfigured()) {
      const res = await transactionService.getTransactions({ startDate, endDate, accountId, transactionType: 'EXPENSE', pageSize: 500 });
      const map = new Map<string, { name: string; color: string; total: number; count: number }>();
      let overallExpense = 0;

      for (const t of res.data) {
        const catId = t.categoryId || 'uncat';
        const name = t.categoryName || 'Uncategorized';
        const color = t.categoryColor || '#94A3B8';
        const curr = map.get(catId) || { name, color, total: 0, count: 0 };
        curr.total += t.amount;
        curr.count += 1;
        overallExpense += t.amount;
        map.set(catId, curr);
      }

      return Array.from(map.entries())
        .map(([id, val]) => ({
          categoryId: id,
          categoryName: val.name,
          categoryColor: val.color,
          totalAmount: val.total,
          transactionCount: val.count,
          percentage: overallExpense > 0 ? Math.round((val.total / overallExpense) * 100) : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);
    }

    const { data, error } = await supabase.rpc('get_category_spending', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_account_id: accountId || null,
    });

    if (error) throw error;

    const totalSpend = (data || []).reduce((acc: number, item: any) => acc + Number(item.total_amount), 0);

    return (data || []).slice(0, 5).map((row: any) => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      categoryColor: row.category_color,
      totalAmount: Number(row.total_amount),
      transactionCount: Number(row.transaction_count),
      percentage: totalSpend > 0 ? Math.round((Number(row.total_amount) / totalSpend) * 100) : 0,
    }));
  },
};

