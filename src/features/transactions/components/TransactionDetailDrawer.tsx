import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import { Close as CloseIcon, DeleteOutline as DeleteOutlineIcon } from '@mui/icons-material';
import { Transaction } from '@/types/domain.types';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { CategoryChip } from '@/components/common/CategoryChip';
import { formatDateDisplay } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';

interface TransactionDetailDrawerProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  open,
  onClose,
  onDelete,
}) => {
  if (!transaction) return null;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await onDelete(transaction.id);
      onClose();
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 380 }, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Transaction Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Large Amount Display */}
        <Box sx={{ my: 3, textAlign: 'center' }}>
          <AmountDisplay
            amount={transaction.amount}
            type={transaction.transactionType}
            currency={transaction.currency}
            sx={{ fontSize: '2rem', fontWeight: 700 }}
          />
          <Box sx={{ mt: 1 }}>
            <Chip
              label={transaction.transactionType}
              size="small"
              variant="outlined"
              color={
                transaction.transactionType === 'INCOME'
                  ? 'success'
                  : transaction.transactionType === 'EXPENSE'
                  ? 'error'
                  : 'info'
              }
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Key Fields */}
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Date
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatDateDisplay(transaction.date)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {transaction.description}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Bank & Account
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {transaction.bankName} — {transaction.accountName}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Category
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {transaction.categoryName ? (
                <CategoryChip
                  name={transaction.categoryName}
                  color={transaction.categoryColor || '#64748B'}
                />
              ) : (
                <CategoryChip name="Uncategorized" color="#94A3B8" />
              )}
            </Box>
          </Box>

          {transaction.runningBalance !== null && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Running Balance
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(transaction.runningBalance, transaction.currency)}
              </Typography>
            </Box>
          )}

          {transaction.notes && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Notes
              </Typography>
              <Typography variant="body2">
                {transaction.notes}
              </Typography>
            </Box>
          )}

          <Box>
            <Typography variant="caption" color="text.secondary">
              Created At
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              {new Date(transaction.createdAt).toLocaleString()}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 4 }} />

        {/* Actions */}
        <Stack spacing={1}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            fullWidth
            onClick={handleDelete}
          >
            Delete Transaction
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

