import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
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
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TransactionInsightItem } from '@/types/domain.types';
import { formatCurrency } from '@/lib/utils/currency';

interface SearchInsightPanelProps {
  search: string;
  periodLabel: string;
  data: TransactionInsightItem[];
  isLoading: boolean;
}

export const SearchInsightPanel: React.FC<SearchInsightPanelProps> = ({
  search,
  periodLabel,
  data,
  isLoading,
}) => {
  if (!search.trim()) return null;

  const totalSpent = data.reduce((sum, item) => sum + item.totalAmount, 0);
  const transactionCount = data.reduce((sum, item) => sum + item.transactionCount, 0);
  const average = transactionCount > 0 ? totalSpent / transactionCount : 0;

  return (
    <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Search insights for “{search}”
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Totals for {periodLabel}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Total</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(totalSpent)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Transactions</Typography>
              <Typography variant="h6" fontWeight={700}>{transactionCount}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Avg.</Typography>
              <Typography variant="h6" fontWeight={700}>{formatCurrency(average)}</Typography>
            </Box>
          </Stack>
        </Stack>

        {isLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading matched transaction totals...
          </Typography>
        ) : data.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No matching transaction activity found for this search and time window.
          </Typography>
        ) : (
          <>
            <Box sx={{ width: '100%', height: 260, mb: 3 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 8)} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Total']} 
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="totalAmount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Match</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Avg.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.label}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                      </TableCell>
                      <TableCell align="right">{item.transactionCount}</TableCell>
                      <TableCell align="right">{formatCurrency(item.totalAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.averageAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};
