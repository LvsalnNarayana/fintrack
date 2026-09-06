import React, { useState } from 'react';
import {
  Box,
  Button,
  Pagination,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { PageHeader } from '@/components/common/PageHeader';
import { TransactionFilterBar } from '../components/TransactionFilterBar';
import { TransactionCard } from '../components/TransactionCard';
import { TransactionTable } from '../components/TransactionTable';
import { TransactionFormDialog } from '../components/TransactionFormDialog';
import { TransactionDetailDrawer } from '../components/TransactionDetailDrawer';
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useTransactions } from '../hooks/useTransactions';
import { Transaction, TransactionType } from '@/types/domain.types';

export const TransactionsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Filter and pagination state
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [page, setPage] = useState(1);

  // Dialog & Drawer state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const {
    transactions,
    total,
    totalPages,
    isLoading,
    isError,
    refetch,
    createTransaction,
    deleteTransaction,
  } = useTransactions({
    search: search || undefined,
    transactionType: selectedType === 'ALL' ? undefined : selectedType,
    accountId: selectedAccountId || undefined,
    categoryId: selectedCategoryId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
    page,
    pageSize: 30,
  });

  return (
    <Box>
      <PageHeader
        title="Transactions"
        subtitle={`Showing ${transactions.length} of ${total} records`}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsFormOpen(true)}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Add Transaction
          </Button>
        }
      />

      <TransactionFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        selectedType={selectedType}
        onTypeChange={(t) => {
          setSelectedType(t);
          setPage(1);
        }}
        selectedAccountId={selectedAccountId}
        onAccountChange={(acc) => {
          setSelectedAccountId(acc);
          setPage(1);
        }}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={(cat) => {
          setSelectedCategoryId(cat);
          setPage(1);
        }}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(val) => {
          setStartDate(val);
          setPage(1);
        }}
        onEndDateChange={(val) => {
          setEndDate(val);
          setPage(1);
        }}
        minAmount={minAmount}
        maxAmount={maxAmount}
        onMinAmountChange={(val) => {
          setMinAmount(val);
          setPage(1);
        }}
        onMaxAmountChange={(val) => {
          setMaxAmount(val);
          setPage(1);
        }}
      />

      {isLoading && (
        <LoadingSkeleton type={isMobile ? 'cards' : 'table'} count={6} />
      )}

      {isError && (
        <ErrorState
          title="Error loading transactions"
          message="Could not retrieve the transaction ledger. Please check connection and retry."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && transactions.length === 0 && (
        <EmptyState
          title="No transactions found"
          description={
            search || selectedType !== 'ALL' || selectedAccountId || selectedCategoryId
              ? 'Try clearing or modifying your search and filter criteria.'
              : 'Start tracking by adding your first transaction or importing a bank statement.'
          }
          actionLabel="Add Transaction"
          onAction={() => setIsFormOpen(true)}
        />
      )}

      {!isLoading && !isError && transactions.length > 0 && (
        <>
          {isMobile ? (
            <Box>
              {transactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onClick={() => setSelectedTx(tx)}
                />
              ))}
            </Box>
          ) : (
            <TransactionTable
              transactions={transactions}
              onRowClick={(tx) => setSelectedTx(tx)}
            />
          )}

          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" sx={{ mt: 4, mb: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                color="primary"
                shape="rounded"
              />
            </Stack>
          )}
        </>
      )}

      {/* Add Transaction Dialog */}
      <TransactionFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={createTransaction}
      />

      {/* Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTx}
        open={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        onDelete={deleteTransaction}
      />
    </Box>
  );
};

