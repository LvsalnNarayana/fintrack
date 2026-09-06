import React, { useState } from 'react';
import {
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { Add as AddIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardMetrics } from '../components/DashboardMetrics';
import { SpendingTrendChart } from '../components/SpendingTrendChart';
import { TopCategoriesWidget } from '../components/TopCategoriesWidget';
import { RecentTransactionsWidget } from '../components/RecentTransactionsWidget';
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog';
import { TransactionDetailDrawer } from '@/features/transactions/components/TransactionDetailDrawer';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { getPeriodBounds, PeriodType } from '@/lib/utils/date';
import { Transaction } from '@/types/domain.types';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const { accounts } = useAccounts(true);
  const bounds = getPeriodBounds(period);

  const {
    summary,
    isLoadingSummary,
    topCategories,
    isLoadingCategories,
  } = useDashboardSummary(bounds.startDate, bounds.endDate, selectedAccountId || undefined);

  const {
    transactions,
    createTransaction,
    deleteTransaction,
  } = useTransactions({
    accountId: selectedAccountId || undefined,
    pageSize: 5,
  });

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Financial overview and period insights"
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => navigate('/import/upload')}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Import Statement
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsFormOpen(true)}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Add Transaction
            </Button>
          </Stack>
        }
      />

      {/* Period & Account Switcher Controls */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
          >
            <MenuItem value="this_month">This Month</MenuItem>
            <MenuItem value="last_month">Last Month</MenuItem>
            <MenuItem value="this_year">This Year</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Account</InputLabel>
          <Select
            value={selectedAccountId}
            label="Account"
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            <MenuItem value="">All Accounts</MenuItem>
            {accounts.map((acc) => (
              <MenuItem key={acc.id} value={acc.id}>
                {acc.bankName} — {acc.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Primary KPI Metrics Row */}
      <DashboardMetrics summary={summary} loading={isLoadingSummary} />

      {/* Main Content Grid: 2 columns on desktop */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
          gap: 2.5,
          mb: 3,
        }}
      >
        <SpendingTrendChart />
        <TopCategoriesWidget
          categories={topCategories}
          loading={isLoadingCategories}
        />
      </Box>

      {/* Recent Transactions List */}
      <RecentTransactionsWidget
        transactions={transactions}
        onSelectTx={(tx) => setSelectedTx(tx)}
      />

      {/* Add Transaction Dialog */}
      <TransactionFormDialog
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={createTransaction}
      />

      {/* Transaction Inspector Drawer */}
      <TransactionDetailDrawer
        transaction={selectedTx}
        open={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        onDelete={deleteTransaction}
      />
    </Box>
  );
};

