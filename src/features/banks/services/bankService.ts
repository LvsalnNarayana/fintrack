import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Bank } from '@/types/domain.types';

// In-memory demo banks
let mockBanks: Bank[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    userId: '00000000-0000-0000-0000-000000000001',
    name: 'HDFC Bank',
    logoUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    userId: '00000000-0000-0000-0000-000000000001',
    name: 'ICICI Bank',
    logoUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const bankService = {
  async getBanks(): Promise<Bank[]> {
    if (!isSupabaseConfigured()) {
      return [...mockBanks];
    }

    const { data, error } = await supabase
      .from('banks')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      logoUrl: row.logo_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createBank(name: string): Promise<Bank> {
    if (!isSupabaseConfigured()) {
      const newBank: Bank = {
        id: `mock-bank-${Date.now()}`,
        userId: '00000000-0000-0000-0000-000000000001',
        name,
        logoUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockBanks.push(newBank);
      return newBank;
    }

    const { data, error } = await supabase
      .from('banks')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      logoUrl: data.logo_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async deleteBank(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      mockBanks = mockBanks.filter((b) => b.id !== id);
      return;
    }

    const { error } = await supabase.from('banks').delete().eq('id', id);
    if (error) throw error;
  },
};

