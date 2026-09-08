import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Checkbox,
} from '@mui/material';
import { Transaction } from '@/types/domain.types';
import { CategoryChip } from '@/components/common/CategoryChip';
import { formatDateDisplay } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick?: (transaction: Transaction) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  allSelected?: boolean;
  onToggleAll?: () => void;
  onToggleSelected?: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onRowClick,
  selectionMode = false,
  selectedIds = new Set<string>(),
  allSelected = false,
  onToggleAll,
  onToggleSelected,
}) => {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="transactions table">
        <TableHead>
          <TableRow>
            {selectionMode && (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedIds.size > 0 && !allSelected}
                  onChange={onToggleAll}
                  inputProps={{ 'aria-label': 'Select all visible transactions' }}
                />
              </TableCell>
            )}
            <TableCell sx={{ width: 120 }}>Date</TableCell>
            <TableCell sx={{ width: 140 }}>Bank & Account</TableCell>
            <TableCell sx={{ width: 140 }}>Category</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right" sx={{ width: 120 }}>Deposit</TableCell>
            <TableCell align="right" sx={{ width: 120 }}>Withdrawal</TableCell>
            <TableCell align="right" sx={{ width: 130 }}>Balance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((row) => (
            <TableRow
              key={row.id}
              hover
              onClick={() => onRowClick?.(row)}
              sx={{ cursor: 'pointer' }}
            >
              {selectionMode && (
                <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(row.id)}
                    onChange={() => onToggleSelected?.(row.id)}
                    inputProps={{ 'aria-label': `Select ${row.description}` }}
                  />
                </TableCell>
              )}
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDateDisplay(row.date)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={500} noWrap>
                  {row.accountName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {row.bankName}
                </Typography>
              </TableCell>
              <TableCell>
                {row.categoryName ? (
                  <CategoryChip
                    name={row.categoryName}
                    color={row.categoryColor || '#64748B'}
                  />
                ) : (
                  <CategoryChip name="Uncategorized" color="#94A3B8" />
                )}
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.primary">
                  {row.description}
                </Typography>
                {row.notes && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Note: {row.notes}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                {row.deposit > 0 ? (
                  <Typography variant="body2" color="success.main" fontWeight={600}>
                    {formatCurrency(row.deposit, row.currency)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled">—</Typography>
                )}
              </TableCell>
              <TableCell align="right">
                {row.withdrawal > 0 ? (
                  <Typography variant="body2" color="error.main" fontWeight={600}>
                    {formatCurrency(row.withdrawal, row.currency)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled">—</Typography>
                )}
              </TableCell>
              <TableCell align="right">
                {row.runningBalance !== null ? (
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(row.runningBalance, row.currency)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled">—</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

