import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  Typography,
} from '@mui/material';
import { ParsedStatementRow } from '../types/import.types';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDateDisplay } from '@/lib/utils/date';

interface ImportPreviewTableProps {
  rows: ParsedStatementRow[];
  onToggleSkip: (index: number) => void;
}

export const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({
  rows,
  onToggleSkip,
}) => {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 70 }}>Import</TableCell>
            <TableCell sx={{ width: 110 }}>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell sx={{ width: 100 }}>Type</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Account</TableCell>
            <TableCell align="right" sx={{ width: 110 }}>Deposit</TableCell>
            <TableCell align="right" sx={{ width: 110 }}>Withdrawal</TableCell>
            <TableCell align="right" sx={{ width: 120 }}>Balance</TableCell>
            <TableCell sx={{ width: 110 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow
              key={idx}
              sx={{
                backgroundColor: row.skipImport ? '#f8fafc' : 'inherit',
                opacity: row.skipImport ? 0.6 : 1,
              }}
            >
              <TableCell>
                <Checkbox
                  size="small"
                  checked={!row.skipImport}
                  onChange={() => onToggleSkip(idx)}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">{formatDateDisplay(row.date)}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{row.description}</Typography>
                {row.notes && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {row.notes}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Typography variant="caption" fontWeight={600}>
                  {row.transactionType || (row.deposit > 0 ? 'INCOME' : 'EXPENSE')}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {row.categoryName || '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {row.accountName
                    ? row.bankName
                      ? `${row.bankName} — ${row.accountName}`
                      : row.accountName
                    : '—'}
                </Typography>
              </TableCell>
              <TableCell align="right">
                {row.deposit > 0 ? (
                  <Typography variant="body2" color="success.main" fontWeight={600}>
                    {formatCurrency(row.deposit, row.currency)}
                  </Typography>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell align="right">
                {row.withdrawal > 0 ? (
                  <Typography variant="body2" color="error.main" fontWeight={600}>
                    {formatCurrency(row.withdrawal, row.currency)}
                  </Typography>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell align="right">
                {row.runningBalance !== null ? (
                  <Typography variant="body2">
                    {formatCurrency(row.runningBalance, row.currency)}
                  </Typography>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                {row.isDuplicate ? (
                  <Chip
                    label="Duplicate"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                ) : (
                  <Chip label="Ready" size="small" color="success" variant="outlined" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

