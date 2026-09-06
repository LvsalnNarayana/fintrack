import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  CategorySpendingItem,
  MonthlyCashFlowItem,
  TopMerchantItem,
  TransactionInsightItem,
} from '@/types/domain.types';
import { transactionService } from '@/features/transactions/services/transactionService';

export const analyticsService = {
  async getTransactionSearchInsights(
    searchTerm: string,
    startDate: string,
    endDate: string,
    accountId?: string,
    categoryId?: string,
    transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  ): Promise<TransactionInsightItem[]> {
    if (!searchTerm.trim()) return [];

    const res = await transactionService.getTransactions({
      search: searchTerm,
      startDate,
      endDate,
      accountId,
      categoryId,
      transactionType,
      pageSize: 500,
    });

    const map = new Map<string, { totalAmount: number; transactionCount: number }>();
    const lowerQuery = searchTerm.trim().toLowerCase();

    for (const tx of res.data) {
      const haystack = [tx.description, tx.categoryName, tx.notes].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(lowerQuery)) continue;

      const key = tx.description.trim() || tx.categoryName || 'Uncategorized';
      const current = map.get(key) || { totalAmount: 0, transactionCount: 0 };
      current.totalAmount += tx.transactionType === 'EXPENSE' ? Math.abs(tx.amount) : tx.amount;
      current.transactionCount += 1;
      map.set(key, current);
    }

    return Array.from(map.entries())
      .map(([label, value]) => ({
        label,
        totalAmount: value.totalAmount,
        transactionCount: value.transactionCount,
        averageAmount: value.transactionCount > 0 ? value.totalAmount / value.transactionCount : 0,
        periodLabel: `${startDate} to ${endDate}`,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  },
  async getCategorySpending(startDate: string, endDate: string, accountId?: string): Promise<CategorySpendingItem[]> {
    if (!isSupabaseConfigured()) {
      const res = await transactionService.getTransactions({
        startDate,
        endDate,
        accountId,
        transactionType: 'EXPENSE',
        pageSize: 500,
      });

      const map = new Map<string, { name: string; color: string; total: number; count: number }>();
      let overall = 0;

      for (const t of res.data) {
        const id = t.categoryId || 'uncat';
        const name = t.categoryName || 'Uncategorized';
        const color = t.categoryColor || '#94A3B8';
        const existing = map.get(id) || { name, color, total: 0, count: 0 };
        existing.total += t.amount;
        existing.count += 1;
        overall += t.amount;
        map.set(id, existing);
      }

      return Array.from(map.entries())
        .map(([id, val]) => ({
          categoryId: id,
          categoryName: val.name,
          categoryColor: val.color,
          totalAmount: val.total,
          transactionCount: val.count,
          percentage: overall > 0 ? Math.round((val.total / overall) * 100) : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);
    }

    const { data, error } = await supabase.rpc('get_category_spending', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_account_id: accountId || null,
    });

    if (error) throw error;

    const totalSpend = (data || []).reduce((sum: number, r: any) => sum + Number(r.total_amount), 0);

    return (data || []).map((r: any) => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      categoryColor: r.category_color,
      totalAmount: Number(r.total_amount),
      transactionCount: Number(r.transaction_count),
      percentage: totalSpend > 0 ? Math.round((Number(r.total_amount) / totalSpend) * 100) : 0,
    }));
  },

  async getMonthlyCashFlow(year: number, accountId?: string): Promise<MonthlyCashFlowItem[]> {
    if (!isSupabaseConfigured()) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map((name, i) => {
        const isCurrentMonth = i === 8; // September
        return {
          monthNum: i + 1,
          monthName: name,
          totalIncome: isCurrentMonth ? 75000 : i < 8 ? 70000 : 0,
          totalExpense: isCurrentMonth ? 38730 : i < 8 ? 45000 : 0,
          netSavings: isCurrentMonth ? 36270 : i < 8 ? 25000 : 0,
        };
      });
    }

    const { data, error } = await supabase.rpc('get_monthly_cash_flow', {
      p_year: year,
      p_account_id: accountId || null,
    });

    if (error) throw error;

    return (data || []).map((r: any) => ({
      monthNum: r.month_num,
      monthName: r.month_name,
      totalIncome: Number(r.total_income),
      totalExpense: Number(r.total_expense),
      netSavings: Number(r.net_savings),
    }));
  },

  async getTopMerchants(startDate: string, endDate: string, limit = 10): Promise<TopMerchantItem[]> {
    if (!isSupabaseConfigured()) {
      const res = await transactionService.getTransactions({
        startDate,
        endDate,
        transactionType: 'EXPENSE',
        pageSize: 500,
      });

      const map = new Map<string, { total: number; count: number }>();
      for (const t of res.data) {
        const desc = t.description;
        const existing = map.get(desc) || { total: 0, count: 0 };
        existing.total += t.amount;
        existing.count += 1;
        map.set(desc, existing);
      }

      return Array.from(map.entries())
        .map(([name, val]) => ({
          merchantName: name,
          totalSpent: val.total,
          transactionCount: val.count,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit);
    }

    const { data, error } = await supabase.rpc('get_top_merchants', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_limit: limit,
    });

    if (error) throw error;

    return (data || []).map((r: any) => ({
      merchantName: r.merchant_name,
      totalSpent: Number(r.total_spent),
      transactionCount: Number(r.transaction_count),
    }));
  },
};

