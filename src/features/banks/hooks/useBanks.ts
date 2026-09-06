import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankService } from '../services/bankService';
import { queryKeys } from '@/lib/query/queryKeys';

export const useBanks = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.banks.list(),
    queryFn: () => bankService.getBanks(),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => bankService.createBank(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banks.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bankService.deleteBank(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });

  return {
    ...query,
    banks: query.data || [],
    createBank: createMutation.mutateAsync,
    deleteBank: deleteMutation.mutateAsync,
  };
};

