import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { CategorySpendingItem } from '@/types/domain.types';
import { CategoryChip } from '@/components/common/CategoryChip';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDateDisplay } from '@/lib/utils/date';

interface CategoryTransactionsDialogProps {
  open: boolean;
  category: CategorySpendingItem | null;
  startDate: string;
  endDate: string;
  accountId?: string;
  periodLabel: string;
  onClose: () => void;
}

export const CategoryTransactionsDialog: React.FC<CategoryTransactionsDialogProps> = ({
  open,
  category,
  startDate,
  endDate,
  accountId,
  periodLabel,
  onClose,
}) => {
  const categoryId = category?.categoryId;
  const isUncategorized = categoryId === 'uncat' || categoryId === null;

  const { transactions, total, isLoading } = useTransactions({
    categoryId: isUncategorized ? 'uncat' : categoryId || undefined,
    startDate,
    endDate,
    accountId,
    transactionType: 'EXPENSE',
    sortBy: 'date',
    sortDirection: 'desc',
    page: 1,
    pageSize: 200,
  });

  const listTotal = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="category-transactions-title"
    >
      <DialogTitle id="category-transactions-title" sx={{ pr: 6 }}>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            {category && (
              <CategoryChip
                name={category.categoryName}
                color={category.categoryColor || '#64748B'}
              />
            )}
            <Typography variant="h6" fontWeight={600} component="span">
              Transactions
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {periodLabel}
            {category ? ` · ${formatCurrency(category.totalAmount)} · ${category.transactionCount} txn${category.transactionCount === 1 ? '' : 's'}` : ''}
          </Typography>
        </Stack>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 1.5, sm: 3 }, py: 2 }}>
        {!open || !category ? null : isLoading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="There are no expense transactions for this category in the selected period."
          />
        ) : (
          <>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Listed total
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {formatCurrency(listTotal)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Showing
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {transactions.length} of {total}
                </Typography>
              </Paper>
            </Stack>

            {/* Mobile list */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Stack spacing={1.25}>
                {transactions.map((tx) => (
                  <Paper key={tx.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateDisplay(tx.date)}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {tx.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tx.bankName} · {tx.accountName}
                        </Typography>
                      </Box>
                      <AmountDisplay
                        amount={tx.amount}
                        type={tx.transactionType}
                        currency={tx.currency}
                        variant="body2"
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* Desktop table */}
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDateDisplay(tx.date)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {tx.description}
                        </Typography>
                        {tx.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {tx.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {tx.bankName} · {tx.accountName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <AmountDisplay
                          amount={tx.amount}
                          type={tx.transactionType}
                          currency={tx.currency}
                          variant="body2"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
