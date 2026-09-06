import React from 'react';
import { Card, CardActionArea, CardContent, Box, Typography, Stack } from '@mui/material';
import { Transaction } from '@/types/domain.types';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { CategoryChip } from '@/components/common/CategoryChip';
import { formatDateDisplay } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onClick }) => {
  return (
    <Card sx={{ mb: 1.5 }}>
      <CardActionArea onClick={onClick} sx={{ p: 0.5 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          {/* Top Row: Date and Signed Amount */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {formatDateDisplay(transaction.date)}
            </Typography>
            <AmountDisplay
              amount={transaction.amount}
              type={transaction.transactionType}
              currency={transaction.currency}
              variant="subtitle1"
            />
          </Box>

          {/* Middle Row: Category Tag and Narration */}
          <Box sx={{ mb: 1 }}>
            {transaction.categoryName ? (
              <CategoryChip
                name={transaction.categoryName}
                color={transaction.categoryColor || '#64748B'}
                sx={{ mb: 0.5 }}
              />
            ) : (
              <CategoryChip name="Uncategorized" color="#94A3B8" sx={{ mb: 0.5 }} />
            )}
            <Typography
              variant="body2"
              fontWeight={500}
              color="text.primary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {transaction.description}
            </Typography>
          </Box>

          {/* Bottom Row: Account & Running Balance */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {transaction.bankName} • {transaction.accountName}
            </Typography>
            {transaction.runningBalance !== null && (
              <Typography variant="caption" color="text.secondary">
                Bal: <strong>{formatCurrency(transaction.runningBalance, transaction.currency)}</strong>
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

