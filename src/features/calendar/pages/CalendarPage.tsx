import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useAutoSelectSingleAccount } from '@/features/accounts/hooks/useAutoSelectSingleAccount';
import { formatCurrency } from '@/lib/utils/currency';
import { useCalendarMonth } from '../hooks/useCalendarMonth';
import { MonthCalendarGrid } from '../components/MonthCalendarGrid';
import { DayDetailDialog } from '../components/DayDetailDialog';
import {
  CalendarDaySummary,
  findDaySummary,
  getAdjacentDate,
  getMonthLabel,
  shiftMonth,
} from '../utils/calendarUtils';

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { accounts } = useAccounts(true);

  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedDay, setSelectedDay] = useState<CalendarDaySummary | null>(null);

  useAutoSelectSingleAccount(accounts, selectedAccountId, setSelectedAccountId);

  const { days, summary, isLoading, isError, refetch } = useCalendarMonth(
    monthDate,
    selectedAccountId || undefined
  );

  const selectedDayLive = useMemo(() => {
    if (!selectedDay) return null;
    return findDaySummary(days, selectedDay.date) || selectedDay;
  }, [days, selectedDay]);

  const goToday = () => {
    const now = new Date();
    setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const openDay = (day: CalendarDaySummary) => {
    setSelectedDay(day);
  };

  const shiftSelectedDay = (delta: number) => {
    if (!selectedDay) return;
    const nextDate = getAdjacentDate(selectedDay.date, delta);
    const nextDay = findDaySummary(days, nextDate);
    if (nextDay) {
      setSelectedDay(nextDay);
      if (!nextDay.inCurrentMonth) {
        setMonthDate(new Date(nextDay.dateObj.getFullYear(), nextDay.dateObj.getMonth(), 1));
      }
      return;
    }
    // Day outside currently loaded grid — move month and keep intent via date string
    const [year, month, dayNum] = nextDate.split('-').map(Number);
    setMonthDate(new Date(year, month - 1, 1));
    setSelectedDay({
      ...(selectedDay),
      date: nextDate,
      dateObj: new Date(year, month - 1, dayNum),
      inCurrentMonth: true,
      isToday: false,
      isWeekend: false,
      transactions: [],
      expenses: [],
      income: 0,
      expense: 0,
      net: 0,
      hasActivity: false,
      intensity: 0,
      categories: [],
    });
  };

  const openInLedger = (date: string) => {
    navigate(`/transactions?period=custom_range&start=${date}&end=${date}`);
  };

  return (
    <Box>
      <PageHeader
        title="Calendar"
        subtitle="Day-by-day view of spending intensity across the month"
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<TodayIcon />}
              onClick={goToday}
            >
              Today
            </Button>
          </Stack>
        }
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <IconButton
            onClick={() => setMonthDate((current) => shiftMonth(current, -1))}
            aria-label="Previous month"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ minWidth: { xs: 160, sm: 200 }, textAlign: 'center' }}>
            {getMonthLabel(monthDate)}
          </Typography>
          <IconButton
            onClick={() => setMonthDate((current) => shiftMonth(current, 1))}
            aria-label="Next month"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>

        <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
          <InputLabel>Account</InputLabel>
          <Select
            value={selectedAccountId}
            label="Account"
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            <MenuItem value="">All Accounts</MenuItem>
            {accounts.map((acc) => (
              <MenuItem key={acc.id} value={acc.id}>
                {acc.bankName ? `${acc.bankName} — ${acc.name}` : acc.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        {[
          { label: 'Income', value: formatCurrency(summary.income), color: 'success.main' },
          { label: 'Expenses', value: formatCurrency(summary.expense), color: 'error.main' },
          {
            label: 'Net',
            value: formatCurrency(summary.net),
            color: summary.net >= 0 ? 'success.main' : 'error.main',
          },
          {
            label: 'Active days',
            value: `${summary.activeDays}`,
            color: 'text.primary',
            hint: `${summary.expenseDays} with spend`,
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h6" fontWeight={700} color={item.color} sx={{ lineHeight: 1.25 }}>
                {item.value}
              </Typography>
              {item.hint && (
                <Typography variant="caption" color="text.secondary">
                  {item.hint}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card sx={{ p: { xs: 1.25, sm: 2 } }}>
        {isLoading ? (
          <LoadingSkeleton type="cards" count={4} />
        ) : isError ? (
          <ErrorState
            title="Could not load calendar"
            message="Failed to fetch transactions for this month."
            onRetry={() => refetch()}
          />
        ) : (
          <>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              sx={{ mb: 1.5, px: 0.5 }}
            >
              <Typography variant="body2" color="text.secondary">
                Days with activity are tinted. Deeper red means higher spend that day.
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                  <Typography variant="caption" color="text.secondary">Expense</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                  <Typography variant="caption" color="text.secondary">Income</Typography>
                </Stack>
              </Stack>
            </Stack>

            <MonthCalendarGrid
              days={days}
              selectedDate={selectedDay?.date}
              onSelectDay={openDay}
            />
          </>
        )}
      </Card>

      <DayDetailDialog
        open={Boolean(selectedDay)}
        day={selectedDayLive}
        onClose={() => setSelectedDay(null)}
        onPrevDay={() => shiftSelectedDay(-1)}
        onNextDay={() => shiftSelectedDay(1)}
        onOpenInLedger={openInLedger}
      />
    </Box>
  );
};
