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
  Box,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  TuneOutlined as TuneOutlinedIcon,
  ExpandLess as ExpandLessIcon,
  SwapVert as SwapVertIcon,
  Clear as ClearIcon,
  CalendarMonthOutlined as CalendarMonthOutlinedIcon,
} from '@mui/icons-material';
import { SortDirection, TransactionType } from '@/types/domain.types';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { formatYearMonth, PERIOD_OPTIONS, PeriodType } from '@/lib/utils/date';

interface TransactionFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedType: TransactionType | 'ALL';
  onTypeChange: (type: TransactionType | 'ALL') => void;
  selectedAccountId: string;
  onAccountChange: (accountId: string) => void;
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  customMonth: string;
  onCustomMonthChange: (val: string) => void;
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
  onClearFilters: () => void;
}

const TYPE_OPTIONS = [
  { value: 'ALL' as const, label: 'All' },
  { value: 'EXPENSE' as const, label: 'Expense' },
  { value: 'INCOME' as const, label: 'Income' },
  { value: 'TRANSFER' as const, label: 'Transfer' },
];

export const TransactionFilterBar: React.FC<TransactionFilterBarProps> = ({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedAccountId,
  onAccountChange,
  selectedCategoryId,
  onCategoryChange,
  period,
  onPeriodChange,
  customMonth,
  onCustomMonthChange,
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
  onClearFilters,
}) => {
  const { accounts } = useAccounts(true);
  const { categories } = useCategories();
  const [expanded, setExpanded] = React.useState(false);

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
  const periodLabel =
    period === 'custom_month'
      ? customMonth || 'Custom Month'
      : PERIOD_OPTIONS.find((option) => option.value === period)?.label || 'All Time';

  const advancedFilterCount = [
    selectedAccountId,
    selectedCategoryId,
    minAmount,
    maxAmount,
    period === 'custom_range' && startDate ? startDate : '',
    period === 'custom_range' && endDate ? endDate : '',
  ].filter(Boolean).length;

  const hasActiveFilters = Boolean(
    search ||
      selectedType !== 'ALL' ||
      selectedAccountId ||
      selectedCategoryId ||
      minAmount ||
      maxAmount ||
      period !== 'all'
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 3,
        borderRadius: 2.5,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack spacing={1.75}>
          {/* Search + actions */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.25}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
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
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.default',
                },
              }}
            />

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
              <Tooltip title={`Sort by date (${sortDirection === 'asc' ? 'oldest first' : 'newest first'})`}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={onSortDirectionChange}
                  startIcon={<SwapVertIcon />}
                  sx={{ whiteSpace: 'nowrap', bgcolor: 'background.default' }}
                >
                  {sortDirection === 'asc' ? 'Oldest' : 'Newest'}
                </Button>
              </Tooltip>

              <Button
                size="small"
                variant={expanded ? 'contained' : 'outlined'}
                startIcon={expanded ? <ExpandLessIcon /> : <TuneOutlinedIcon />}
                onClick={() => setExpanded((current) => !current)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                More{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ''}
              </Button>

              {hasActiveFilters && (
                <Tooltip title="Clear all filters">
                  <IconButton
                    size="small"
                    onClick={onClearFilters}
                    aria-label="Clear all filters"
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          {/* Period + Type */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'minmax(180px, 220px) 1fr' },
              gap: 1.5,
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ display: 'block', mb: 0.75, letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                Period
              </Typography>
              <FormControl size="small" fullWidth>
                <Select
                  value={period}
                  onChange={(e) => onPeriodChange(e.target.value as PeriodType)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <CalendarMonthOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', ml: 0.5 }} />
                    </InputAdornment>
                  }
                  sx={{ bgcolor: 'background.default' }}
                >
                  {PERIOD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                sx={{ display: 'block', mb: 0.75, letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                Type
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {TYPE_OPTIONS.map((type) => (
                  <Chip
                    key={type.value}
                    label={type.label}
                    clickable
                    size="small"
                    color={selectedType === type.value ? 'primary' : 'default'}
                    variant={selectedType === type.value ? 'filled' : 'outlined'}
                    onClick={() => onTypeChange(type.value)}
                    sx={{
                      height: 32,
                      px: 0.5,
                      bgcolor: selectedType === type.value ? undefined : 'background.default',
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Box>

          {/* Period-specific date controls */}
          {(period === 'custom_month' || period === 'custom_range') && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'background.default',
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              {period === 'custom_month' && (
                <TextField
                  label="Month"
                  type="month"
                  size="small"
                  value={customMonth}
                  onChange={(e) => onCustomMonthChange(e.target.value || formatYearMonth())}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: { xs: '100%', sm: 200 } }}
                />
              )}

              {period === 'custom_range' && (
                <>
                  <TextField
                    label="From"
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="To"
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </>
              )}
            </Stack>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {period !== 'all' && (
                <Chip
                  size="small"
                  label={`Period: ${periodLabel}`}
                  onDelete={() => onPeriodChange('all')}
                  variant="outlined"
                />
              )}
              {selectedType !== 'ALL' && (
                <Chip
                  size="small"
                  label={`Type: ${selectedType}`}
                  onDelete={() => onTypeChange('ALL')}
                  variant="outlined"
                />
              )}
              {selectedAccount && (
                <Chip
                  size="small"
                  label={`Account: ${selectedAccount.name}`}
                  onDelete={() => onAccountChange('')}
                  variant="outlined"
                />
              )}
              {selectedCategory && (
                <Chip
                  size="small"
                  label={`Category: ${selectedCategory.name}`}
                  onDelete={() => onCategoryChange('')}
                  variant="outlined"
                />
              )}
              {period === 'custom_range' && startDate && (
                <Chip
                  size="small"
                  label={`From: ${startDate}`}
                  onDelete={() => onStartDateChange('')}
                  variant="outlined"
                />
              )}
              {period === 'custom_range' && endDate && (
                <Chip
                  size="small"
                  label={`To: ${endDate}`}
                  onDelete={() => onEndDateChange('')}
                  variant="outlined"
                />
              )}
              {(minAmount || maxAmount) && (
                <Chip
                  size="small"
                  label={`Amount: ${minAmount || '0'} – ${maxAmount || '∞'}`}
                  onDelete={() => {
                    onMinAmountChange('');
                    onMaxAmountChange('');
                  }}
                  variant="outlined"
                />
              )}
            </Stack>
          )}
        </Stack>
      </Box>

      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#fafbfc' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ display: 'block', mb: 1.25, letterSpacing: '0.04em', textTransform: 'uppercase' }}
          >
            Advanced filters
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(4, minmax(0, 1fr))',
              },
              gap: 1.5,
            }}
          >
            <FormControl size="small" fullWidth>
              <InputLabel>Account</InputLabel>
              <Select
                value={selectedAccountId}
                label="Account"
                onChange={(e) => onAccountChange(e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="">All Accounts</MenuItem>
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.bankName ? `${acc.bankName} — ${acc.name}` : acc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategoryId}
                label="Category"
                onChange={(e) => onCategoryChange(e.target.value)}
                sx={{ bgcolor: 'background.paper' }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Min amount"
              type="number"
              size="small"
              value={minAmount}
              onChange={(e) => onMinAmountChange(e.target.value)}
              sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
            />

            <TextField
              label="Max amount"
              type="number"
              size="small"
              value={maxAmount}
              onChange={(e) => onMaxAmountChange(e.target.value)}
              sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};
