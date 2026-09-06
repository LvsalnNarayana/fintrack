import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Transaction,
  TransactionFilterParams,
  PaginatedResult,
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from '@/types/domain.types';

// Initial realistic demo transactions
let mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    userId: '00000000-0000-0000-0000-000000000001',
    accountId: 'a1111111-1111-1111-1111-111111111111',
    accountName: 'Salary Account',
    bankName: 'HDFC Bank',
    categoryId: 'c-sal',
    categoryName: 'Salary',
    categoryColor: '#16A34A',
    importBatchId: null,
    date: '2026-09-01',
    description: 'ABC Technologies Monthly Salary',
    amount: 75000,
    transactionType: 'INCOME',
    deposit: 75000,
    withdrawal: 0,
    runningBalance: 100000,
    currency: 'INR',
    notes: 'September credit',
    transferPairId: null,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'tx-2',
    userId: '00000000-0000-0000-0000-000000000001',
    accountId: 'a1111111-1111-1111-1111-111111111111',
    accountName: 'Salary Account',
    bankName: 'HDFC Bank',
    categoryId: 'c-rent',
    categoryName: 'Rent & Housing',
    categoryColor: '#8B5CF6',
    importBatchId: null,
    date: '2026-09-02',
    description: 'Apartment Monthly Rent',
    amount: 22000,
    transactionType: 'EXPENSE',
    deposit: 0,
    withdrawal: 22000,
    runningBalance: 78000,
    currency: 'INR',
    notes: 'Paid to Landlord',
    transferPairId: null,
    createdAt: '2026-09-02T11:00:00Z',
    updatedAt: '2026-09-02T11:00:00Z',
  },
  {
    id: 'tx-3',
    userId: '00000000-0000-0000-0000-000000000001',
    accountId: 'a1111111-1111-1111-1111-111111111111',
    accountName: 'Salary Account',
    bankName: 'HDFC Bank',
    categoryId: 'c-food',
    categoryName: 'Food & Dining',
    categoryColor: '#EF4444',
    importBatchId: null,
    date: '2026-09-04',
    description: 'Swiggy Dinner Order',
    amount: 450,
    transactionType: 'EXPENSE',
    deposit: 0,
    withdrawal: 450,
    runningBalance: 77550,
    currency: 'INR',
    notes: null,
    transferPairId: null,
    createdAt: '2026-09-04T20:30:00Z',
    updatedAt: '2026-09-04T20:30:00Z',
  },
  {
    id: 'tx-4',
    userId: '00000000-0000-0000-0000-000000000001',
    accountId: 'a1111111-1111-1111-1111-111111111111',
    accountName: 'Salary Account',
    bankName: 'HDFC Bank',
    categoryId: 'c-groc',
    categoryName: 'Groceries',
    categoryColor: '#F97316',
    importBatchId: null,
    date: '2026-09-05',
    description: 'Blinkit Household Staples',
    amount: 1280,
    transactionType: 'EXPENSE',
    deposit: 0,
    withdrawal: 1280,
    runningBalance: 76270,
    currency: 'INR',
    notes: null,
    transferPairId: null,
    createdAt: '2026-09-05T09:15:00Z',
    updatedAt: '2026-09-05T09:15:00Z',
  },
  {
    id: 'tx-5',
    userId: '00000000-0000-0000-0000-000000000001',
    accountId: 'a1111111-1111-1111-1111-111111111111',
    accountName: 'Salary Account',
    bankName: 'HDFC Bank',
    categoryId: null,
    categoryName: undefined,
    categoryColor: undefined,
    importBatchId: null,
    date: '2026-09-06',
    description: 'Transfer to ICICI Savings',
    amount: 15000,
    transactionType: 'TRANSFER',
    deposit: 0,
    withdrawal: 15000,
    runningBalance: 61270,
    currency: 'INR',
    notes: 'Savings allocation',
    transferPairId: 'tx-5-pair',
    createdAt: '2026-09-06T14:00:00Z',
    updatedAt: '2026-09-06T14:00:00Z',
  },
];

export const transactionService = {
  async getTransactions(params: TransactionFilterParams = {}): Promise<PaginatedResult<Transaction>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;

    if (!isSupabaseConfigured()) {
      let filtered = [...mockTransactions];

      if (params.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.description.toLowerCase().includes(query) ||
            t.categoryName?.toLowerCase().includes(query) ||
            t.notes?.toLowerCase().includes(query)
        );
      }

      if (params.accountId) {
        filtered = filtered.filter((t) => t.accountId === params.accountId);
      }

      if (params.categoryId) {
        filtered = filtered.filter((t) => t.categoryId === params.categoryId);
      }

      if (params.transactionType) {
        filtered = filtered.filter((t) => t.transactionType === params.transactionType);
      }

      if (params.startDate) {
        filtered = filtered.filter((t) => t.date >= params.startDate!);
      }

      if (params.endDate) {
        filtered = filtered.filter((t) => t.date <= params.endDate!);
      }

      // Sort by date desc
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const total = filtered.length;
      const startIndex = (page - 1) * pageSize;
      const paginatedData = filtered.slice(startIndex, startIndex + pageSize);

      return {
        data: paginatedData,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    }

    // Hosted Supabase Query
    let query = supabase
      .from('transactions')
      .select(
        '*, accounts(name, banks(name)), categories(name, color)',
        { count: 'exact' }
      )
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (params.search) {
      query = query.ilike('description', `%${params.search}%`);
    }

    if (params.accountId) {
      query = query.eq('account_id', params.accountId);
    }

    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId);
    }

    if (params.transactionType) {
      query = query.eq('transaction_type', params.transactionType);
    }

    if (params.startDate) {
      query = query.gte('date', params.startDate);
    }

    if (params.endDate) {
      query = query.lte('date', params.endDate);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      accountName: row.accounts?.name || 'Account',
      bankName: row.accounts?.banks?.name || 'Bank',
      categoryId: row.category_id,
      categoryName: row.categories?.name,
      categoryColor: row.categories?.color,
      importBatchId: row.import_batch_id,
      date: row.date,
      description: row.description,
      amount: Number(row.amount),
      transactionType: row.transaction_type,
      deposit: Number(row.deposit),
      withdrawal: Number(row.withdrawal),
      runningBalance: row.running_balance !== null ? Number(row.running_balance) : null,
      currency: row.currency,
      notes: row.notes,
      transferPairId: row.transfer_pair_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const total = count || 0;
    return {
      data: mapped,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },

  async createTransaction(dto: CreateTransactionDTO): Promise<Transaction> {
    const deposit = dto.transactionType === 'INCOME' ? dto.amount : 0;
    const withdrawal = dto.transactionType === 'EXPENSE' || dto.transactionType === 'TRANSFER' ? dto.amount : 0;

    if (!isSupabaseConfigured()) {
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        userId: '00000000-0000-0000-0000-000000000001',
        accountId: dto.accountId,
        accountName: 'Demo Account',
        bankName: 'Demo Bank',
        categoryId: dto.categoryId || null,
        importBatchId: null,
        date: dto.date,
        description: dto.description,
        amount: dto.amount,
        transactionType: dto.transactionType,
        deposit,
        withdrawal,
        runningBalance: null,
        currency: dto.currency || 'INR',
        notes: dto.notes || null,
        transferPairId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTransactions.unshift(newTx);
      return newTx;
    }

    // Supabase Insert
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        account_id: dto.accountId,
        category_id: dto.categoryId || null,
        date: dto.date,
        description: dto.description,
        amount: dto.amount,
        transaction_type: dto.transactionType,
        deposit,
        withdrawal,
        currency: dto.currency || 'INR',
        notes: dto.notes || null,
      })
      .select('*, accounts(name, banks(name)), categories(name, color)')
      .single();

    if (error) throw error;

    // If transfer with target account, create reciprocal pair
    if (dto.transactionType === 'TRANSFER' && dto.transferDestinationAccountId) {
      const { data: pairData } = await supabase
        .from('transactions')
        .insert({
          account_id: dto.transferDestinationAccountId,
          category_id: dto.categoryId || null,
          date: dto.date,
          description: `Transfer from ${data.accounts?.name || 'Account'}`,
          amount: dto.amount,
          transaction_type: 'TRANSFER',
          deposit: dto.amount,
          withdrawal: 0,
          currency: dto.currency || 'INR',
          transfer_pair_id: data.id,
        })
        .select('id')
        .single();

      if (pairData) {
        await supabase
          .from('transactions')
          .update({ transfer_pair_id: pairData.id })
          .eq('id', data.id);
      }
    }

    return {
      id: data.id,
      userId: data.user_id,
      accountId: data.account_id,
      accountName: data.accounts?.name || 'Account',
      bankName: data.accounts?.banks?.name || 'Bank',
      categoryId: data.category_id,
      categoryName: data.categories?.name,
      categoryColor: data.categories?.color,
      importBatchId: data.import_batch_id,
      date: data.date,
      description: data.description,
      amount: Number(data.amount),
      transactionType: data.transaction_type,
      deposit: Number(data.deposit),
      withdrawal: Number(data.withdrawal),
      runningBalance: data.running_balance !== null ? Number(data.running_balance) : null,
      currency: data.currency,
      notes: data.notes,
      transferPairId: data.transfer_pair_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateTransaction(id: string, dto: UpdateTransactionDTO): Promise<void> {
    if (!isSupabaseConfigured()) {
      const tx = mockTransactions.find((t) => t.id === id);
      if (tx) {
        if (dto.accountId) tx.accountId = dto.accountId;
        if (dto.categoryId !== undefined) tx.categoryId = dto.categoryId;
        if (dto.date) tx.date = dto.date;
        if (dto.description) tx.description = dto.description;
        if (dto.amount !== undefined) {
          tx.amount = dto.amount;
          if (tx.transactionType === 'INCOME') tx.deposit = dto.amount;
          if (tx.transactionType === 'EXPENSE') tx.withdrawal = dto.amount;
        }
        if (dto.notes !== undefined) tx.notes = dto.notes;
      }
      return;
    }

    const updates: any = {};
    if (dto.accountId) updates.account_id = dto.accountId;
    if (dto.categoryId !== undefined) updates.category_id = dto.categoryId;
    if (dto.date) updates.date = dto.date;
    if (dto.description) updates.description = dto.description;
    if (dto.amount !== undefined) updates.amount = dto.amount;
    if (dto.notes !== undefined) updates.notes = dto.notes;

    const { error } = await supabase.from('transactions').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteTransaction(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      mockTransactions = mockTransactions.filter((t) => t.id !== id);
      return;
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },
};

