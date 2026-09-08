import React from 'react';
import {
  TextField,
  Chip,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Paper,
  Collapse,
  Button,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { Search as SearchIcon, TuneOutlined as TuneOutlinedIcon, ExpandLess as ExpandLessIcon, SwapVert as SwapVertIcon } from '@mui/icons-material';
import { SortDirection, TransactionType } from '@/types/domain.types';
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
  sortDirection: SortDirection;
  onSortDirectionChange: () => void;
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
  sortDirection,
  onSortDirectionChange,
}) => {
  const { accounts } = useAccounts(true);
  const { categories } = useCategories();
  const [expanded, setExpanded] = React.useState(false);
  const activeFilterCount = [selectedAccountId, selectedCategoryId, startDate, endDate, minAmount, maxAmount]
    .filter(Boolean).length;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }}>
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
            sx={{ minWidth: 220, flex: 1 }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" fontWeight={600} sx={{ px: 1, whiteSpace: 'nowrap' }}>
              Date + import order
            </Typography>
            <Tooltip title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}>
              <IconButton size="small" onClick={onSortDirectionChange} aria-label="Toggle sort direction">
                <SwapVertIcon />
              </IconButton>
            </Tooltip>
            <Button
              size="small"
              variant={expanded ? 'contained' : 'outlined'}
              startIcon={expanded ? <ExpandLessIcon /> : <TuneOutlinedIcon />}
              onClick={() => setExpanded((current) => !current)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Button>
          </Stack>
        </Stack>

        <Collapse in={expanded}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center">
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 150 } }}>
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

          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 150 } }}>
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

            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems="center">
          <TextField
            label="From"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', lg: 160 } }}
          />

          <TextField
            label="To"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', lg: 160 } }}
          />

          <TextField
            label="Min"
            type="number"
            size="small"
            value={minAmount}
            onChange={(e) => onMinAmountChange(e.target.value)}
            sx={{ minWidth: { xs: '100%', lg: 120 } }}
          />

          <TextField
            label="Max"
            type="number"
            size="small"
            value={maxAmount}
            onChange={(e) => onMaxAmountChange(e.target.value)}
            sx={{ minWidth: { xs: '100%', lg: 120 } }}
          />
            </Stack>
          </Stack>
        </Collapse>

        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
          {(['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'] as const).map((type) => (
            <Chip
              key={type}
              label={type === 'ALL' ? 'All' : type}
              clickable
              size="small"
              color={selectedType === type ? 'primary' : 'default'}
              variant={selectedType === type ? 'filled' : 'outlined'}
              onClick={() => onTypeChange(type)}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};

