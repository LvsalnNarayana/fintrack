import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Chip,
  Typography,
} from '@mui/material';
import { ColumnMapping, ImportFormatType, TargetField } from '../types/import.types';

interface ColumnMappingTableProps {
  mappings: ColumnMapping[];
  importFormat: ImportFormatType;
  onMappingChange: (originalHeader: string, newTarget: TargetField) => void;
}

const BANK_FIELD_OPTIONS: { value: TargetField; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'description', label: 'Transaction Description' },
  { value: 'deposit', label: 'Deposit / Credit' },
  { value: 'withdrawal', label: 'Withdrawal / Debit' },
  { value: 'running_balance', label: 'Running Balance' },
  { value: 'currency', label: 'Currency' },
  { value: 'ignore', label: '— Ignore Column —' },
];

const FINTRACK_FIELD_OPTIONS: { value: TargetField; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'description', label: 'Description' },
  { value: 'type', label: 'Type (Income / Expense / Transfer)' },
  { value: 'amount', label: 'Amount' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'category', label: 'Category' },
  { value: 'notes', label: 'Notes' },
  { value: 'running_balance', label: 'Running Balance' },
  { value: 'currency', label: 'Currency' },
  { value: 'ignore', label: '— Ignore Column —' },
];

export const ColumnMappingTable: React.FC<ColumnMappingTableProps> = ({
  mappings,
  importFormat,
  onMappingChange,
}) => {
  const fieldOptions = importFormat === 'fintrack_export'
    ? FINTRACK_FIELD_OPTIONS
    : BANK_FIELD_OPTIONS;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>File Header</TableCell>
            <TableCell>Mapped FinTrack Field</TableCell>
            <TableCell align="right">Detection Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mappings.map((m) => (
            <TableRow key={m.originalHeader}>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {m.originalHeader}
                </Typography>
              </TableCell>
              <TableCell>
                <Select
                  size="small"
                  value={m.targetField}
                  onChange={(e) =>
                    onMappingChange(m.originalHeader, e.target.value as TargetField)
                  }
                  sx={{ minWidth: 240 }}
                >
                  {fieldOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>
              <TableCell align="right">
                {m.confidence === 1.0 ? (
                  <Chip label="Exact match" size="small" color="success" variant="outlined" />
                ) : m.confidence > 0 ? (
                  <Chip label="Probable match" size="small" color="primary" variant="outlined" />
                ) : m.targetField === 'ignore' ? (
                  <Chip label="Ignored" size="small" variant="outlined" />
                ) : (
                  <Chip label="Unmapped" size="small" variant="outlined" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
