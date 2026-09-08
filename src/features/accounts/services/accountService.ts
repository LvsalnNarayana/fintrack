import { supabase, isSupabaseConfigured, getAuthenticatedUserId } from '@/lib/supabase/client';
import { Account, AccountType } from '@/types/domain.types';

export interface CreateAccountInput {
  bankId: string;
  name: string;
  accountType: AccountType;
  accountNumberMask?: string;
  currency?: string;
  openingBalance?: number;
}

export interface UpdateAccountBalanceInput {
  id: string;
  openingBalance: number;
}

// In-memory demo accounts
let mockAccounts: Account[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    userId: '00000000-0000-0000-0000-000000000001',
    bankId: 'b1111111-1111-1111-1111-111111111111',
    bankName: 'HDFC Bank',
    name: 'Salary Account',
    accountType: 'SALARY',
    accountNumberMask: 'XX4120',
    currency: 'INR',
    openingBalance: 25000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    userId: '00000000-0000-0000-0000-000000000001',
    bankId: 'b2222222-2222-2222-2222-222222222222',
    bankName: 'ICICI Bank',
    name: 'Savings Account',
    accountType: 'SAVINGS',
    accountNumberMask: 'XX8921',
    currency: 'INR',
    openingBalance: 50000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const accountService = {
  async getAccounts(activeOnly = false): Promise<Account[]> {
    if (!isSupabaseConfigured()) {
      return activeOnly ? mockAccounts.filter((a) => a.isActive) : [...mockAccounts];
    }

    let query = supabase
      .from('accounts')
      .select('*, banks(name)')
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      bankId: row.bank_id,
      bankName: row.banks?.name || 'Unknown Bank',
      name: row.name,
      accountType: row.account_type,
      accountNumberMask: row.account_number_mask,
      currency: row.currency,
      openingBalance: Number(row.opening_balance),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createAccount(input: CreateAccountInput): Promise<Account> {
    if (!isSupabaseConfigured()) {
      const newAcc: Account = {
        id: `mock-acc-${Date.now()}`,
        userId: '00000000-0000-0000-0000-000000000001',
        bankId: input.bankId,
        bankName: 'Bank',
        name: input.name,
        accountType: input.accountType,
        accountNumberMask: input.accountNumberMask || null,
        currency: input.currency || 'INR',
        openingBalance: input.openingBalance || 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockAccounts.push(newAcc);
      return newAcc;
    }

    const userId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        bank_id: input.bankId,
        name: input.name,
        account_type: input.accountType,
        account_number_mask: input.accountNumberMask || null,
        currency: input.currency || 'INR',
        opening_balance: input.openingBalance || 0,
        is_active: true,
      })
      .select('*, banks(name)')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      bankId: data.bank_id,
      bankName: (data as any).banks?.name || '',
      name: data.name,
      accountType: data.account_type,
      accountNumberMask: data.account_number_mask,
      currency: data.currency,
      openingBalance: Number(data.opening_balance),
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateAccountBalance({ id, openingBalance }: UpdateAccountBalanceInput): Promise<void> {
    if (!isSupabaseConfigured()) {
      const acc = mockAccounts.find((a) => a.id === id);
      if (acc) {
        acc.openingBalance = openingBalance;
        acc.updatedAt = new Date().toISOString();
      }
      return;
    }

    const { error } = await supabase
      .from('accounts')
      .update({ opening_balance: openingBalance })
      .eq('id', id);

    if (error) throw error;
  },

  async toggleAccountActive(id: string, isActive: boolean): Promise<void> {
    if (!isSupabaseConfigured()) {
      const acc = mockAccounts.find((a) => a.id === id);
      if (acc) acc.isActive = isActive;
      return;
    }

    const { error } = await supabase
      .from('accounts')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  },
};

