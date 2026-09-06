import { TransactionFilterParams } from '@/types/domain.types';

export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
    profile: ['auth', 'profile'] as const,
  },
  banks: {
    all: ['banks'] as const,
    list: () => [...queryKeys.banks.all, 'list'] as const,
  },
  accounts: {
    all: ['accounts'] as const,
    list: (activeOnly = false) => [...queryKeys.accounts.all, 'list', { activeOnly }] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (includeArchived = false) => [...queryKeys.categories.all, 'list', { includeArchived }] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filter: TransactionFilterParams) => [...queryKeys.transactions.all, 'list', filter] as const,
    detail: (id: string) => [...queryKeys.transactions.all, 'detail', id] as const,
    recent: (limit = 5) => [...queryKeys.transactions.all, 'recent', limit] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    dashboardSummary: (startDate: string, endDate: string, accountId?: string) =>
      [...queryKeys.analytics.all, 'dashboardSummary', startDate, endDate, accountId] as const,
    categorySpending: (startDate: string, endDate: string, accountId?: string) =>
      [...queryKeys.analytics.all, 'categorySpending', startDate, endDate, accountId] as const,
    monthlyCashFlow: (year: number, accountId?: string) =>
      [...queryKeys.analytics.all, 'monthlyCashFlow', year, accountId] as const,
    topMerchants: (startDate: string, endDate: string, limit = 10) =>
      [...queryKeys.analytics.all, 'topMerchants', startDate, endDate, limit] as const,
  },
  importBatches: {
    all: ['importBatches'] as const,
    list: () => [...queryKeys.importBatches.all, 'list'] as const,
  },
  rules: {
    all: ['rules'] as const,
    list: () => [...queryKeys.rules.all, 'list'] as const,
  },
};

