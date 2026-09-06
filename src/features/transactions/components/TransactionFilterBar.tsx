import React from 'react';
import {
  Box,
  TextField,
  Chip,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { TransactionType } from '@/types/domain.types';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/categories/hooks/useCategories';

interface TransactionFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedType: TransactionType | 'ALL';
  onTypeChange: (type: TransactionType | 'ALL') => void;
  selectedAccountId: string;
  onAccountChange: (accountId: string) => void;
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  minAmount: string;
  maxAmount: string;
  onMinAmountChange: (val: string) => void;
  onMaxAmountChange: (val: string) => void;
}

export const TransactionFilterBar: React.FC<TransactionFilterBarProps> = ({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedAccountId,
  onAccountChange,
  selectedCategoryId,
  onCategoryChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minAmount,
  maxAmount,
  onMinAmountChange,
  onMaxAmountChange,
}) => {
  const { accounts } = useAccounts(true);
  const { categories } = useCategories();

  return (
    <Box sx={{ mb: 3 }}>
      <Stack spacing={2}>
        {/* Row 1: Search & Dropdowns */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
          <TextField
            placeholder="Search description, category, or notes..."
            size="small"
            fullWidth
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel>Account</InputLabel>
            <Select
              value={selectedAccountId}
              label="Account"
              onChange={(e) => onAccountChange(e.target.value)}
            >
              <MenuItem value="">All Accounts</MenuItem>
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategoryId}
              label="Category"
              onChange={(e) => onCategoryChange(e.target.value)}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
          <TextField
            label="From"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', md: 170 } }}
          />

          <TextField
            label="To"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', md: 170 } }}
          />

          <TextField
            label="Min amount"
            type="number"
            size="small"
            value={minAmount}
            onChange={(e) => onMinAmountChange(e.target.value)}
            sx={{ minWidth: { xs: '100%', md: 140 } }}
          />

          <TextField
            label="Max amount"
            type="number"
            size="small"
            value={maxAmount}
            onChange={(e) => onMaxAmountChange(e.target.value)}
            sx={{ minWidth: { xs: '100%', md: 140 } }}
          />
        </Stack>

        {/* Row 2: Quick Filter Chips */}
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
          {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((type) => (
            <Chip
              key={type}
              label={type === 'ALL' ? 'All Transactions' : type}
              clickable
              size="small"
              color={selectedType === type ? 'primary' : 'default'}
              variant={selectedType === type ? 'filled' : 'outlined'}
              onClick={() => onTypeChange(type)}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};

