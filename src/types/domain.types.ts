export type AccountType = 'SAVINGS' | 'CURRENT' | 'SALARY' | 'CREDIT_CARD' | 'CASH' | 'OTHER';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type CategoryType = 'INCOME' | 'EXPENSE';

export type RuleMatchType = 'CONTAINS' | 'EXACT' | 'STARTS_WITH' | 'REGEX';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  baseCurrency: string;
  dateFormat: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bank {
  id: string;
  userId: string;
  name: string;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  userId: string;
  bankId: string;
  bankName?: string;
  name: string;
  accountType: AccountType;
  accountNumberMask?: string | null;
  currency: string;
  openingBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  parentId?: string | null;
  name: string;
  type: CategoryType;
  color: string;
  icon?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ImportBatch {
  id: string;
  userId: string;
  accountId: string;
  sourceFileName: string;
  sourceFileHash: string;
  totalRows: number;
  importedRows: number;
  skippedDuplicates: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  accountName?: string;
  bankName?: string;
  categoryId: string | null;
  categoryName?: string;
  categoryColor?: string;
  importBatchId: string | null;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  transactionType: TransactionType;
  deposit: number;
  withdrawal: number;
  runningBalance: number | null;
  currency: string;
  notes: string | null;
  transferPairId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategorizationRule {
  id: string;
  userId: string;
  keyword: string;
  matchType: RuleMatchType;
  categoryId: string;
  categoryName?: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilterParams {
  search?: string;
  bankId?: string;
  accountId?: string;
  categoryId?: string;
  transactionType?: TransactionType;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardSummary {
  income: number;
  expense: number;
  netFlow: number;
  currentBalance: number;
}

export interface CategorySpendingItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalAmount: number;
  transactionCount: number;
  percentage?: number;
}

export interface MonthlyCashFlowItem {
  monthNum: number;
  monthName: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
}

export interface TopMerchantItem {
  merchantName: string;
  totalSpent: number;
  transactionCount: number;
}

export interface CreateTransactionDTO {
  accountId: string;
  categoryId?: string | null;
  date: string;
  description: string;
  amount: number;
  transactionType: TransactionType;
  currency?: string;
  notes?: string | null;
  transferDestinationAccountId?: string;
}

export interface UpdateTransactionDTO {
  accountId?: string;
  categoryId?: string | null;
  date?: string;
  description?: string;
  amount?: number;
  transactionType?: TransactionType;
  notes?: string | null;
}

