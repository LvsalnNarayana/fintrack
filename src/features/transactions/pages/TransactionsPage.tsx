import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Pagination,
  Stack,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, DeleteOutline as DeleteOutlineIcon, Close as CloseIcon, FileDownloadOutlined as FileDownloadOutlinedIcon } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
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
import { transactionService } from '../services/transactionService';
import { downloadTransactionsCsv } from '../utils/exportCsv';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import {
  getSingleAccountId,
  useAutoSelectSingleAccount,
} from '@/features/accounts/hooks/useAutoSelectSingleAccount';
import { Transaction, TransactionType } from '@/types/domain.types';
import { formatYearMonth, getPeriodBounds, PeriodType } from '@/lib/utils/date';

const isPeriodType = (value: string | null): value is PeriodType => {
  return value === 'this_month'
    || value === 'last_month'
    || value === 'this_year'
    || value === 'all'
    || value === 'custom_month'
    || value === 'custom_range';
};

export const TransactionsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();

  // Filter and pagination state
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [period, setPeriod] = useState<PeriodType>(() => {
    const fromQuery = searchParams.get('period');
    return isPeriodType(fromQuery) ? fromQuery : 'all';
  });
  const [customMonth, setCustomMonth] = useState(formatYearMonth());
  const [startDate, setStartDate] = useState(() => searchParams.get('start') || '');
  const [endDate, setEndDate] = useState(() => searchParams.get('end') || '');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy] = useState<'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fromQuery = searchParams.get('period');
    if (isPeriodType(fromQuery)) {
      setPeriod(fromQuery);
    }
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    if (start) setStartDate(start);
    if (end) setEndDate(end);
    if (start || end || isPeriodType(fromQuery)) {
      setPage(1);
    }
  }, [searchParams]);

  // Dialog & Drawer state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleteAllRequested, setDeleteAllRequested] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const deleteResolver = useRef<((deleted: boolean) => void) | null>(null);

  const { accounts } = useAccounts(true);
  useAutoSelectSingleAccount(accounts, selectedAccountId, setSelectedAccountId);

  const filterParams = {
    search: search || undefined,
    transactionType: selectedType === 'ALL' ? undefined : selectedType,
    accountId: selectedAccountId || undefined,
    categoryId: selectedCategoryId || undefined,
    startDate: (() => {
      if (period === 'custom_range') return startDate || undefined;
      if (period === 'all') return undefined;
      return getPeriodBounds(period, customMonth).startDate;
    })(),
    endDate: (() => {
      if (period === 'custom_range') return endDate || undefined;
      if (period === 'all') return undefined;
      return getPeriodBounds(period, customMonth).endDate;
    })(),
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
    sortBy,
    sortDirection,
  } as const;

  const {
    transactions,
    total,
    totalPages,
    isLoading,
    isError,
    refetch,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAllTransactions,
  } = useTransactions({
    ...filterParams,
    page,
    pageSize: 30,
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedType('ALL');
    setSelectedAccountId(getSingleAccountId(accounts));
    setSelectedCategoryId('');
    setPeriod('all');
    setCustomMonth(formatYearMonth());
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const result = await transactionService.getTransactions({
        ...filterParams,
        page: 1,
        pageSize: Math.max(total || 0, 5000),
      });
      if (result.data.length === 0) {
        setExportError('No transactions match the current filters to export.');
        return;
      }
      downloadTransactionsCsv(result.data);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const allSelected = transactions.length > 0 && transactions.every((tx) => selectedIds.has(tx.id));

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSelected = () => {
    setSelectedIds(allSelected ? new Set() : new Set(transactions.map((tx) => tx.id)));
  };

  const closeSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const requestDelete = (ids: string[], deleteAll = false): Promise<boolean> => {
    return new Promise((resolve) => {
      deleteResolver.current = resolve;
      setDeleteIds(ids);
      setDeleteAllRequested(deleteAll);
      setDeletePassword('');
      setDeleteError(null);
      setDeleteDialogOpen(true);
    });
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeletePassword('');
    setDeleteError(null);
    deleteResolver.current?.(false);
    deleteResolver.current = null;
  };

  const confirmDelete = async () => {
    const requiredPassword = import.meta.env.VITE_SETTINGS_PASSWORD || 'fintrack123';
    if (deletePassword !== requiredPassword) {
      setDeleteError('Incorrect password.');
      return;
    }

    setDeleting(true);
    try {
      if (deleteAllRequested) {
        await deleteAllTransactions();
      } else {
        await Promise.all(deleteIds.map((id) => deleteTransaction(id)));
      }
      setDeleteDialogOpen(false);
      setDeletePassword('');
      deleteResolver.current?.(true);
      deleteResolver.current = null;
      closeSelectionMode();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete transaction(s)');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Transactions"
        subtitle={`Showing ${transactions.length} of ${total} records`}
        action={
          <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-end', sm: 'initial' }}>
            {selectionMode ? (
              <>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  disabled={selectedIds.size === 0 || deleting}
                  onClick={() => requestDelete([...selectedIds])}
                >
                  Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={deleting}
                  onClick={() => requestDelete([], true)}
                >
                  Delete all
                </Button>
                <Tooltip title="Cancel selection">
                  <IconButton onClick={closeSelectionMode} disabled={deleting} aria-label="Cancel selection">
                    <CloseIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title="Export filtered transactions as CSV">
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadOutlinedIcon />}
                      onClick={handleExportCsv}
                      disabled={exporting || isLoading || total === 0}
                      sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                      Export CSV
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Export CSV">
                  <span>
                    <IconButton
                      onClick={handleExportCsv}
                      disabled={exporting || isLoading || total === 0}
                      aria-label="Export CSV"
                      sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                    >
                      {exporting ? <CircularProgress size={18} /> : <FileDownloadOutlinedIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Select transactions to delete">
                  <IconButton onClick={() => setSelectionMode(true)} aria-label="Select transactions to delete">
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsFormOpen(true)}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Add Transaction
                </Button>
              </>
            )}
          </Stack>
        }
      />

      {exportError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      )}
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
        period={period}
        onPeriodChange={(nextPeriod) => {
          setPeriod(nextPeriod);
          if (nextPeriod !== 'custom_range') {
            setStartDate('');
            setEndDate('');
          }
          setPage(1);
        }}
        customMonth={customMonth}
        onCustomMonthChange={(val) => {
          setCustomMonth(val);
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
        sortDirection={sortDirection}
        onSortDirectionChange={() => {
          setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
          setPage(1);
        }}
        onClearFilters={clearFilters}
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
            search ||
            selectedType !== 'ALL' ||
            selectedAccountId ||
            selectedCategoryId ||
            period !== 'all' ||
            minAmount ||
            maxAmount
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
                  selectionMode={selectionMode}
                  selected={selectedIds.has(tx.id)}
                  onToggleSelected={() => toggleSelected(tx.id)}
                />
              ))}
            </Box>
          ) : (
            <TransactionTable
              transactions={transactions}
              onRowClick={(tx) => setSelectedTx(tx)}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              allSelected={allSelected}
              onToggleAll={toggleAllSelected}
              onToggleSelected={toggleSelected}
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
        onClose={() => {
          setIsFormOpen(false);
          setEditingTx(null);
        }}
        onSubmit={createTransaction}
        onUpdate={editingTx ? (dto) => updateTransaction({ id: editingTx.id, dto }) : undefined}
        initialTransaction={editingTx}
      />

      {/* Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTx}
        open={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        onEdit={(transaction) => {
          setSelectedTx(null);
          setEditingTx(transaction);
          setIsFormOpen(true);
        }}
        onDelete={(id) => requestDelete([id])}
      />

      <Dialog open={deleteDialogOpen} onClose={cancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle>{deleteAllRequested ? 'Delete all transactions?' : 'Confirm deletion'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              {deleteAllRequested
                ? 'This permanently removes every transaction in your account.'
                : `This permanently removes ${deleteIds.length} selected transaction${deleteIds.length === 1 ? '' : 's'}.`}
            </Alert>
            {deleteError && <Alert severity="error">{deleteError}</Alert>}
            <TextField
              label="Settings password"
              type="password"
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') confirmDelete();
              }}
              autoFocus
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={deleting}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            color="error"
            disabled={deleting || !deletePassword}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <DeleteOutlineIcon />}
          >
            Delete permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

