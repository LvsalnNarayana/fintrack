import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Stack } from '@mui/material';
import { CategorySpendingItem } from '@/types/domain.types';
import { formatCurrency } from '@/lib/utils/currency';

interface TopCategoriesWidgetProps {
  categories: CategorySpendingItem[];
  loading?: boolean;
}

export const TopCategoriesWidget: React.FC<TopCategoriesWidgetProps> = ({
  categories,
  loading = false,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Top Spending Categories
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Largest expense allocations
        </Typography>

        {loading ? (
          <Typography variant="body2" color="text.secondary">Loading breakdown...</Typography>
        ) : categories.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No categorized expenses in this period.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {categories.map((cat) => (
              <Box key={cat.categoryId}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {cat.categoryName}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(cat.totalAmount)}
                    {cat.percentage !== undefined && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({cat.percentage}%)
                      </Typography>
                    )}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={cat.percentage || 10}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#f1f5f9',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: cat.categoryColor || '#3b82f6',
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

