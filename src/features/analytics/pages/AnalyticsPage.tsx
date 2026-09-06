import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { useAnalytics } from '../hooks/useAnalytics';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { getPeriodBounds, PeriodType } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import { CategoryChip } from '@/components/common/CategoryChip';
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton';

export const AnalyticsPage: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const { accounts } = useAccounts(true);
  const bounds = getPeriodBounds(period);

  const {
    categorySpending,
    isLoadingCategories,
    cashFlow,
    isLoadingCashFlow,
    topMerchants,
    isLoadingMerchants,
  } = useAnalytics(bounds.startDate, bounds.endDate, 2026, selectedAccountId || undefined);

  return (
    <Box>
      <PageHeader
        title="Analytics & Trends"
        subtitle="In-depth analysis of spending patterns, categories, and cash flow"
      />

      {/* Filter Controls */}
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Monthly Cash Flow" />
          <Tab label="Category Spending" />
          <Tab label="Top Merchants" />
        </Tabs>
      </Box>

      {/* Tab 0: Cash Flow Bar Chart */}
      {tabIndex === 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Income vs. Expense (2026)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Monthly net cash flow comparison
            </Typography>

            {isLoadingCashFlow ? (
              <LoadingSkeleton type="cards" count={3} />
            ) : (
              <Box sx={{ width: '100%', height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlow} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="monthName" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                    />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val)]}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="totalIncome" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalExpense" name="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 1: Category Spending Breakdown */}
      {tabIndex === 1 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {/* Donut Chart */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Spending Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Proportional category allocation
              </Typography>

              {isLoadingCategories ? (
                <LoadingSkeleton type="cards" count={2} />
              ) : categorySpending.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                  No categorized expenses recorded for this period.
                </Typography>
              ) : (
                <Box sx={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySpending}
                        dataKey="totalAmount"
                        nameKey="categoryName"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {categorySpending.map((entry) => (
                          <Cell key={entry.categoryId} fill={entry.categoryColor || '#3b82f6'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => [formatCurrency(val), 'Total']} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Table Breakdown */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Category Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ranked by expenditure
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Share</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categorySpending.map((cat) => (
                      <TableRow key={cat.categoryId}>
                        <TableCell>
                          <CategoryChip
                            name={cat.categoryName}
                            color={cat.categoryColor || '#64748B'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(cat.totalAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {cat.percentage}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 2: Top Merchants */}
      {tabIndex === 2 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Top Merchants & Vendors
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Most frequent and highest value payees
            </Typography>

            {isLoadingMerchants ? (
              <LoadingSkeleton type="table" count={5} />
            ) : topMerchants.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                No merchant activity found for this period.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Payee / Description</TableCell>
                      <TableCell align="right">Transaction Count</TableCell>
                      <TableCell align="right">Total Spent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topMerchants.map((m, idx) => (
                      <TableRow key={m.merchantName}>
                        <TableCell sx={{ color: 'text.secondary', width: 60 }}>
                          #{idx + 1}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {m.merchantName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {m.transactionCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="error.main">
                            {formatCurrency(m.totalSpent)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

