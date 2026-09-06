import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { queryKeys } from '@/lib/query/queryKeys';

export const useDashboardSummary = (startDate: string, endDate: string, accountId?: string) => {
  const summaryQuery = useQuery({
    queryKey: queryKeys.analytics.dashboardSummary(startDate, endDate, accountId),
    queryFn: () => dashboardService.getSummary(startDate, endDate, accountId),
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.analytics.categorySpending(startDate, endDate, accountId),
    queryFn: () => dashboardService.getTopCategories(startDate, endDate, accountId),
  });

  return {
    summary: summaryQuery.data,
    isLoadingSummary: summaryQuery.isLoading,
    isErrorSummary: summaryQuery.isError,
    topCategories: categoriesQuery.data || [],
    isLoadingCategories: categoriesQuery.isLoading,
    refetchAll: () => {
      summaryQuery.refetch();
      categoriesQuery.refetch();
    },
  };
};

