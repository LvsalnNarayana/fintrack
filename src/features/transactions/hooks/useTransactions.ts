import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/transactionService';
import {
  TransactionFilterParams,
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from '@/types/domain.types';
import { queryKeys } from '@/lib/query/queryKeys';

export const useTransactions = (params: TransactionFilterParams = {}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.transactions.list(params),
    queryFn: () => transactionService.getTransactions(params),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateTransactionDTO) => transactionService.createTransaction(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateTransactionDTO }) =>
      transactionService.updateTransaction(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });

  return {
    ...query,
    transactions: query.data?.data || [],
    total: query.data?.total || 0,
    totalPages: query.data?.totalPages || 1,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    isMutating:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};

