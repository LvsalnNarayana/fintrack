import React from 'react';
import { Box } from '@mui/material';
import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  CompareArrows as CompareArrowsIcon,
} from '@mui/icons-material';
import { StatCard } from '@/components/common/StatCard';
import { DashboardSummary } from '@/types/domain.types';
import { formatCurrency } from '@/lib/utils/currency';

interface DashboardMetricsProps {
  summary?: DashboardSummary;
  loading?: boolean;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  summary,
  loading = false,
}) => {
  const currentBalance = summary?.currentBalance || 0;
  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  const netFlow = summary?.netFlow || 0;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3,
      }}
    >
      <StatCard
        label="Current Balance"
        value={formatCurrency(currentBalance)}
        loading={loading}
        icon={<AccountBalanceWalletIcon fontSize="small" />}
      />
      <StatCard
        label="Total Income"
        value={formatCurrency(income)}
        valueColor="success.main"
        loading={loading}
        icon={<ArrowDownwardIcon fontSize="small" color="success" />}
      />
      <StatCard
        label="Total Expenses"
        value={formatCurrency(expense)}
        valueColor="error.main"
        loading={loading}
        icon={<ArrowUpwardIcon fontSize="small" color="error" />}
      />
      <StatCard
        label="Net Cash Flow"
        value={formatCurrency(netFlow)}
        valueColor={netFlow >= 0 ? 'success.main' : 'error.main'}
        loading={loading}
        icon={<CompareArrowsIcon fontSize="small" />}
      />
    </Box>
  );
};

