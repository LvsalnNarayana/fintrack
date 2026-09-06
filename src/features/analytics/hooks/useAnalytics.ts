import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analyticsService';
import { queryKeys } from '@/lib/query/queryKeys';

export const useAnalytics = (startDate: string, endDate: string, year = 2026, accountId?: string, searchTerm?: string) => {
  const categorySpendingQuery = useQuery({
    queryKey: queryKeys.analytics.categorySpending(startDate, endDate, accountId),
    queryFn: () => analyticsService.getCategorySpending(startDate, endDate, accountId),
  });

  const cashFlowQuery = useQuery({
    queryKey: queryKeys.analytics.monthlyCashFlow(year, accountId),
    queryFn: () => analyticsService.getMonthlyCashFlow(year, accountId),
  });

  const topMerchantsQuery = useQuery({
    queryKey: queryKeys.analytics.topMerchants(startDate, endDate, 10),
    queryFn: () => analyticsService.getTopMerchants(startDate, endDate, 10),
  });

  const searchInsightsQuery = useQuery({
    queryKey: [...queryKeys.analytics.all, 'searchInsights', startDate, endDate, accountId, searchTerm] as const,
    enabled: Boolean(searchTerm && searchTerm.trim()),
    queryFn: () => analyticsService.getTransactionSearchInsights(searchTerm || '', startDate, endDate, accountId),
  });

  return {
    categorySpending: categorySpendingQuery.data || [],
    isLoadingCategories: categorySpendingQuery.isLoading,
    cashFlow: cashFlowQuery.data || [],
    isLoadingCashFlow: cashFlowQuery.isLoading,
    topMerchants: topMerchantsQuery.data || [],
    isLoadingMerchants: topMerchantsQuery.isLoading,
    searchInsights: searchInsightsQuery.data || [],
    isLoadingSearchInsights: searchInsightsQuery.isLoading,
    refetch: () => {
      categorySpendingQuery.refetch();
      cashFlowQuery.refetch();
      topMerchantsQuery.refetch();
      if (searchTerm && searchTerm.trim()) {
        searchInsightsQuery.refetch();
      }
    },
  };
};

