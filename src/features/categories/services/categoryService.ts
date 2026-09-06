import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Category, CategoryType } from '@/types/domain.types';

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  parentId?: string;
}

// Default seeded categories for demo mode
let mockCategories: Category[] = [
  // Income
  { id: 'c-sal', userId: 'mock', name: 'Salary', type: 'INCOME', color: '#16A34A', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-fre', userId: 'mock', name: 'Freelance', type: 'INCOME', color: '#10B981', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-inv-in', userId: 'mock', name: 'Investments', type: 'INCOME', color: '#059669', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-oth-in', userId: 'mock', name: 'Other Income', type: 'INCOME', color: '#6EE7B7', isArchived: false, createdAt: '', updatedAt: '' },
  // Expense
  { id: 'c-food', userId: 'mock', name: 'Food & Dining', type: 'EXPENSE', color: '#EF4444', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-groc', userId: 'mock', name: 'Groceries', type: 'EXPENSE', color: '#F97316', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-shop', userId: 'mock', name: 'Shopping', type: 'EXPENSE', color: '#F59E0B', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-tran', userId: 'mock', name: 'Transportation', type: 'EXPENSE', color: '#3B82F6', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-bill', userId: 'mock', name: 'Bills & Utilities', type: 'EXPENSE', color: '#6366F1', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-rent', userId: 'mock', name: 'Rent & Housing', type: 'EXPENSE', color: '#8B5CF6', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-heal', userId: 'mock', name: 'Healthcare', type: 'EXPENSE', color: '#EC4899', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-ent', userId: 'mock', name: 'Entertainment', type: 'EXPENSE', color: '#14B8A6', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-sub', userId: 'mock', name: 'Subscriptions', type: 'EXPENSE', color: '#A855F7', isArchived: false, createdAt: '', updatedAt: '' },
  { id: 'c-oth-ex', userId: 'mock', name: 'Other Expense', type: 'EXPENSE', color: '#94A3B8', isArchived: false, createdAt: '', updatedAt: '' },
];

export const categoryService = {
  async getCategories(includeArchived = false): Promise<Category[]> {
    if (!isSupabaseConfigured()) {
      return includeArchived ? [...mockCategories] : mockCategories.filter((c) => !c.isArchived);
    }

    let query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      parentId: row.parent_id,
      name: row.name,
      type: row.type,
      color: row.color,
      icon: row.icon,
      isArchived: row.is_archived,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    if (!isSupabaseConfigured()) {
      const newCat: Category = {
        id: `mock-cat-${Date.now()}`,
        userId: 'mock',
        parentId: input.parentId || null,
        name: input.name,
        type: input.type,
        color: input.color || '#64748B',
        icon: input.icon || null,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCategories.push(newCat);
      return newCat;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: input.name,
        type: input.type,
        color: input.color || '#64748B',
        icon: input.icon || null,
        parent_id: input.parentId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      parentId: data.parent_id,
      name: data.name,
      type: data.type,
      color: data.color,
      icon: data.icon,
      isArchived: data.is_archived,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async archiveCategory(id: string, isArchived = true): Promise<void> {
    if (!isSupabaseConfigured()) {
      const cat = mockCategories.find((c) => c.id === id);
      if (cat) cat.isArchived = isArchived;
      return;
    }

    const { error } = await supabase
      .from('categories')
      .update({ is_archived: isArchived })
      .eq('id', id);

    if (error) throw error;
  },
};

