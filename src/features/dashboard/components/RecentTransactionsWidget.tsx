import React from 'react';
import { Card, CardContent, Typography, Box, Button, Stack, Divider } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { Transaction } from '@/types/domain.types';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { formatDateDisplay } from '@/lib/utils/date';
import { useNavigate } from 'react-router-dom';

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
  onSelectTx: (tx: Transaction) => void;
}

export const RecentTransactionsWidget: React.FC<RecentTransactionsWidgetProps> = ({
  transactions,
  onSelectTx,
}) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Recent Transactions
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            onClick={() => navigate('/transactions')}
          >
            View All
          </Button>
        </Box>

        {transactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            No recent activity recorded.
          </Typography>
        ) : (
          <Stack spacing={1.5} divider={<Divider />}>
            {transactions.slice(0, 5).map((tx) => (
              <Box
                key={tx.id}
                onClick={() => onSelectTx(tx)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  py: 0.5,
                  '&:hover': { opacity: 0.8 },
                }}
              >
                <Box sx={{ minWidth: 0, mr: 2 }}>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {tx.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateDisplay(tx.date)} • {tx.accountName}
                  </Typography>
                </Box>
                <AmountDisplay
                  amount={tx.amount}
                  type={tx.transactionType}
                  currency={tx.currency}
                  variant="body2"
                />
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

