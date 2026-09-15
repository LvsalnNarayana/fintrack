import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { CategoryChip } from '@/components/common/CategoryChip';
import { EmptyState } from '@/components/feedback/EmptyState';
import { formatCurrency } from '@/lib/utils/currency';
import { CalendarDaySummary } from '../utils/calendarUtils';

interface DayDetailDialogProps {
  open: boolean;
  day: CalendarDaySummary | null;
  onClose: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onOpenInLedger: (date: string) => void;
}

export const DayDetailDialog: React.FC<DayDetailDialogProps> = ({
  open,
  day,
  onClose,
  onPrevDay,
  onNextDay,
  onOpenInLedger,
}) => {
  if (!day) return null;

  const title = format(parseISO(day.date), 'EEEE, d MMMM yyyy');
  const expenses = day.expenses;
  const hasExpenses = expenses.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby="day-detail-title"
    >
      <DialogTitle id="day-detail-title" sx={{ pr: 7, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
          <IconButton size="small" onClick={onPrevDay} aria-label="Previous day">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flex: 1, textAlign: 'center' }}>
            {title}
          </Typography>
          <IconButton size="small" onClick={onNextDay} aria-label="Next day">
            <ChevronRightIcon />
          </IconButton>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          justifyContent="center"
          sx={{ mt: 1 }}
        >
          <Paper variant="outlined" sx={{ px: 1.5, py: 1, minWidth: 120, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Spent</Typography>
            <Typography variant="subtitle1" fontWeight={700} color="error.main">
              {formatCurrency(day.expense)}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ px: 1.5, py: 1, minWidth: 120, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Income</Typography>
            <Typography variant="subtitle1" fontWeight={700} color="success.main">
              {formatCurrency(day.income)}
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ px: 1.5, py: 1, minWidth: 120, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">Net</Typography>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              color={day.net >= 0 ? 'success.main' : 'error.main'}
            >
              {formatCurrency(day.net)}
            </Typography>
          </Paper>
        </Stack>

        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        {!day.hasActivity ? (
          <EmptyState
            title="Quiet day"
            description="No transactions were recorded on this date. Tap another highlighted day to inspect spending."
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2.5,
              alignItems: 'start',
            }}
          >
            {/* Left: category pie */}
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Category mix
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Expense breakdown for this day
              </Typography>

              {!hasExpenses ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                  No expenses on this day{day.income > 0 ? ' — only income was recorded.' : '.'}
                </Typography>
              ) : (
                <>
                  <Box sx={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={day.categories}
                          dataKey="totalAmount"
                          nameKey="categoryName"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {day.categories.map((entry) => (
                            <Cell key={entry.categoryId} fill={entry.categoryColor || '#3b82f6'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => [formatCurrency(val), 'Spent']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>

                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {day.categories.map((cat) => (
                      <Stack
                        key={cat.categoryId}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                      >
                        <CategoryChip name={cat.categoryName} color={cat.categoryColor} />
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(cat.totalAmount)}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                            {cat.percentage}%
                          </Typography>
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </Paper>

            {/* Right: expense / transaction list */}
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Day activity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {day.transactions.length} transaction{day.transactions.length === 1 ? '' : 's'}
              </Typography>

              <Stack spacing={1.25} divider={<Divider flexItem />}>
                {day.transactions.map((tx) => (
                  <Box key={tx.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        {tx.categoryName ? (
                          <CategoryChip
                            name={tx.categoryName}
                            color={tx.categoryColor || '#64748B'}
                            sx={{ mb: 0.5 }}
                          />
                        ) : (
                          <CategoryChip name="Uncategorized" color="#94A3B8" sx={{ mb: 0.5 }} />
                        )}
                        <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                          {tx.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tx.bankName} · {tx.accountName}
                        </Typography>
                      </Box>
                      <AmountDisplay
                        amount={tx.amount}
                        type={tx.transactionType}
                        currency={tx.currency}
                        variant="body2"
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, justifyContent: 'space-between' }}>
        <Button
          startIcon={<OpenInNewIcon />}
          onClick={() => onOpenInLedger(day.date)}
          disabled={!day.hasActivity}
        >
          Open in ledger
        </Button>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
