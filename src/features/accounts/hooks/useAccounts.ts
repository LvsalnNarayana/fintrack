import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService, CreateAccountInput, UpdateAccountBalanceInput } from '../services/accountService';
import { queryKeys } from '@/lib/query/queryKeys';

export const useAccounts = (activeOnly = false) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.accounts.list(activeOnly),
    queryFn: () => accountService.getAccounts(activeOnly),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateAccountInput) => accountService.createAccount(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });

  const updateBalanceMutation = useMutation({
    mutationFn: (input: UpdateAccountBalanceInput) => accountService.updateAccountBalance(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      accountService.toggleAccountActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });

  return {
    ...query,
    accounts: query.data || [],
    createAccount: createMutation.mutateAsync,
    updateAccountBalance: updateBalanceMutation.mutateAsync,
    toggleActive: toggleActiveMutation.mutateAsync,
  };
};

