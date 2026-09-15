import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Transaction } from '@/types/domain.types';
import { formatIsoDate } from '@/lib/utils/date';

export interface DayCategorySlice {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface CalendarDaySummary {
  date: string;
  dateObj: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  transactions: Transaction[];
  expenses: Transaction[];
  income: number;
  expense: number;
  net: number;
  hasActivity: boolean;
  intensity: number; // 0–1 based on expense relative to month max
  categories: DayCategorySlice[];
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getMonthGridDays = (monthDate: Date): Date[] => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd });
};

export const groupTransactionsByDate = (transactions: Transaction[]): Map<string, Transaction[]> => {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = tx.date;
    const list = map.get(key) || [];
    list.push(tx);
    map.set(key, list);
  }
  return map;
};

const buildCategorySlices = (expenses: Transaction[]): DayCategorySlice[] => {
  const map = new Map<string, { name: string; color: string; total: number; count: number }>();
  let overall = 0;

  for (const tx of expenses) {
    const id = tx.categoryId || 'uncat';
    const name = tx.categoryName || 'Uncategorized';
    const color = tx.categoryColor || '#94A3B8';
    const existing = map.get(id) || { name, color, total: 0, count: 0 };
    existing.total += tx.amount;
    existing.count += 1;
    overall += tx.amount;
    map.set(id, existing);
  }

  return Array.from(map.entries())
    .map(([categoryId, val]) => ({
      categoryId,
      categoryName: val.name,
      categoryColor: val.color,
      totalAmount: val.total,
      transactionCount: val.count,
      percentage: overall > 0 ? Math.round((val.total / overall) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
};

export const buildCalendarDaySummaries = (
  monthDate: Date,
  transactions: Transaction[]
): CalendarDaySummary[] => {
  const byDate = groupTransactionsByDate(transactions);
  const days = getMonthGridDays(monthDate);

  let maxExpense = 0;
  const drafts = days.map((day) => {
    const date = formatIsoDate(day);
    const dayTx = (byDate.get(date) || []).slice().sort((a, b) => {
      if (a.transactionType === b.transactionType) return b.amount - a.amount;
      if (a.transactionType === 'EXPENSE') return -1;
      if (b.transactionType === 'EXPENSE') return 1;
      return 0;
    });
    const expenses = dayTx.filter((tx) => tx.transactionType === 'EXPENSE');
    const income = dayTx
      .filter((tx) => tx.transactionType === 'INCOME')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    maxExpense = Math.max(maxExpense, expense);

    return {
      date,
      dateObj: day,
      inCurrentMonth: isSameMonth(day, monthDate),
      isToday: isToday(day),
      isWeekend: isWeekend(day),
      transactions: dayTx,
      expenses,
      income,
      expense,
      net: income - expense,
      hasActivity: dayTx.length > 0,
      intensity: 0,
      categories: buildCategorySlices(expenses),
    };
  });

  return drafts.map((day) => ({
    ...day,
    intensity: day.expense > 0 && maxExpense > 0 ? Math.min(1, day.expense / maxExpense) : 0,
  }));
};

export const getMonthLabel = (monthDate: Date): string => format(monthDate, 'MMMM yyyy');

export const shiftMonth = (monthDate: Date, delta: number): Date => {
  const next = new Date(monthDate);
  next.setDate(1);
  next.setMonth(next.getMonth() + delta);
  return next;
};

export const findDaySummary = (
  days: CalendarDaySummary[],
  date: string | Date
): CalendarDaySummary | undefined => {
  const key = typeof date === 'string' ? date : formatIsoDate(date);
  return days.find((day) => day.date === key);
};

export const isSameCalendarDay = (a: string, b: string): boolean => {
  try {
    return isSameDay(parseISO(a), parseISO(b));
  } catch {
    return a === b;
  }
};

export const getAdjacentDate = (date: string, delta: number): string => {
  return formatIsoDate(addDays(parseISO(date), delta));
};
