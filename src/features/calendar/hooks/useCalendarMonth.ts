import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { endOfMonth, startOfMonth } from 'date-fns';
import { transactionService } from '@/features/transactions/services/transactionService';
import { queryKeys } from '@/lib/query/queryKeys';
import { formatIsoDate } from '@/lib/utils/date';
import { buildCalendarDaySummaries, getMonthLabel } from '../utils/calendarUtils';

export const useCalendarMonth = (monthDate: Date, accountId?: string) => {
  const startDate = formatIsoDate(startOfMonth(monthDate));
  const endDate = formatIsoDate(endOfMonth(monthDate));

  const query = useQuery({
    queryKey: queryKeys.transactions.list({
      startDate,
      endDate,
      accountId,
      page: 1,
      pageSize: 2000,
      sortBy: 'date',
      sortDirection: 'asc',
    }),
    queryFn: () =>
      transactionService.getTransactions({
        startDate,
        endDate,
        accountId,
        page: 1,
        pageSize: 2000,
        sortBy: 'date',
        sortDirection: 'asc',
      }),
  });

  const days = useMemo(
    () => buildCalendarDaySummaries(monthDate, query.data?.data || []),
    [monthDate, query.data?.data]
  );

  const monthDays = useMemo(
    () => days.filter((day) => day.inCurrentMonth),
    [days]
  );

  const summary = useMemo(() => {
    const income = monthDays.reduce((sum, day) => sum + day.income, 0);
    const expense = monthDays.reduce((sum, day) => sum + day.expense, 0);
    const activeDays = monthDays.filter((day) => day.hasActivity).length;
    const expenseDays = monthDays.filter((day) => day.expense > 0).length;

    return {
      income,
      expense,
      net: income - expense,
      activeDays,
      expenseDays,
      transactionCount: monthDays.reduce((sum, day) => sum + day.transactions.length, 0),
      label: getMonthLabel(monthDate),
    };
  }, [monthDays, monthDate]);

  return {
    ...query,
    days,
    monthDays,
    summary,
    startDate,
    endDate,
  };
};
