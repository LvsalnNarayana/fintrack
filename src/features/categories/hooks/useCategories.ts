import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService, CreateCategoryInput } from '../services/categoryService';
import { queryKeys } from '@/lib/query/queryKeys';

export const useCategories = (includeArchived = false) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.categories.list(includeArchived),
    queryFn: () => categoryService.getCategories(includeArchived),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryService.createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      categoryService.archiveCategory(id, isArchived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });

  return {
    ...query,
    categories: query.data || [],
    createCategory: createMutation.mutateAsync,
    archiveCategory: archiveMutation.mutateAsync,
  };
};

