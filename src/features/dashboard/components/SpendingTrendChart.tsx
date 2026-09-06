import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';

interface SpendingTrendChartProps {
  data?: { date: string; amount: number }[];
}

const mockTrend = [
  { date: '01 Sep', amount: 0 },
  { date: '02 Sep', amount: 22000 },
  { date: '03 Sep', amount: 0 },
  { date: '04 Sep', amount: 450 },
  { date: '05 Sep', amount: 1280 },
  { date: '06 Sep', amount: 15000 },
];

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  data = mockTrend,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Spending Trend
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Daily expenses across accounts for selected period
        </Typography>

        <Box sx={{ width: '100%', height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                formatter={(val: number) => [formatCurrency(val), 'Spending']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

