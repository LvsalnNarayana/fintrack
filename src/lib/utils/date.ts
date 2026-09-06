import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  isValid,
} from 'date-fns';

export const formatDateDisplay = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    return format(date, 'dd MMM yyyy');
  } catch {
    return dateString;
  }
};

export const formatIsoDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export type PeriodType = 'this_month' | 'last_month' | 'this_year' | 'all';

export interface PeriodBounds {
  startDate: string;
  endDate: string;
  label: string;
}

export const getPeriodBounds = (period: PeriodType): PeriodBounds => {
  const now = new Date();
  
  switch (period) {
    case 'this_month':
      return {
        startDate: formatIsoDate(startOfMonth(now)),
        endDate: formatIsoDate(endOfMonth(now)),
        label: 'This Month',
      };
    case 'last_month': {
      const prevMonth = subMonths(now, 1);
      return {
        startDate: formatIsoDate(startOfMonth(prevMonth)),
        endDate: formatIsoDate(endOfMonth(prevMonth)),
        label: 'Last Month',
      };
    }
    case 'this_year':
      return {
        startDate: formatIsoDate(startOfYear(now)),
        endDate: formatIsoDate(endOfYear(now)),
        label: 'This Year',
      };
    case 'all':
    default:
      return {
        startDate: '2000-01-01',
        endDate: '2099-12-31',
        label: 'All Time',
      };
  }
};

