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

export type PeriodType = 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom_month' | 'custom_range';

export interface PeriodBounds {
  startDate: string;
  endDate: string;
  label: string;
}

export const formatYearMonth = (date: Date = new Date()): string => {
  return format(date, 'yyyy-MM');
};

export const getCustomMonthBounds = (yearMonth: string): PeriodBounds => {
  const parsed = parseISO(`${yearMonth}-01`);
  const monthDate = isValid(parsed) ? parsed : startOfMonth(new Date());

  return {
    startDate: formatIsoDate(startOfMonth(monthDate)),
    endDate: formatIsoDate(endOfMonth(monthDate)),
    label: format(monthDate, 'MMMM yyyy'),
  };
};

export const PERIOD_OPTIONS: Array<{ value: PeriodType; label: string }> = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom_month', label: 'Custom Month' },
  { value: 'custom_range', label: 'Custom Range' },
  { value: 'all', label: 'All Time' },
];

export const getPeriodBounds = (period: PeriodType, customMonth?: string): PeriodBounds => {
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
    case 'custom_month':
      return getCustomMonthBounds(customMonth || formatYearMonth(now));
    case 'custom_range':
      return {
        startDate: '',
        endDate: '',
        label: 'Custom Range',
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

