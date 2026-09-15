import React from 'react';
import { Box, Typography, Stack, Tooltip } from '@mui/material';
import { formatCurrency } from '@/lib/utils/currency';
import { CalendarDaySummary, WEEKDAY_LABELS } from '../utils/calendarUtils';

interface MonthCalendarGridProps {
  days: CalendarDaySummary[];
  selectedDate?: string | null;
  onSelectDay: (day: CalendarDaySummary) => void;
}

const getDayBackground = (day: CalendarDaySummary): string => {
  if (!day.inCurrentMonth) return 'transparent';
  if (!day.hasActivity) return '#ffffff';
  if (day.expense <= 0 && day.income > 0) return 'rgba(22, 163, 74, 0.10)';
  const alpha = 0.08 + day.intensity * 0.22;
  return `rgba(220, 38, 38, ${alpha.toFixed(3)})`;
};

const getDayBorder = (day: CalendarDaySummary, selected: boolean): string => {
  if (selected) return '2px solid #1e293b';
  if (day.isToday) return '2px solid #3b82f6';
  if (day.hasActivity) return '1px solid rgba(148, 163, 184, 0.55)';
  return '1px solid #e2e8f0';
};

export const MonthCalendarGrid: React.FC<MonthCalendarGridProps> = ({
  days,
  selectedDate,
  onSelectDay,
}) => {
  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: { xs: 0.5, sm: 1 },
          mb: 1,
        }}
      >
        {WEEKDAY_LABELS.map((label) => (
          <Typography
            key={label}
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{
              textAlign: 'center',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              py: 0.5,
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: { xs: 0.5, sm: 1 },
        }}
      >
        {days.map((day) => {
          const selected = selectedDate === day.date;
          const tip = day.hasActivity
            ? `${formatCurrency(day.expense)} spent · ${formatCurrency(day.income)} income · ${day.transactions.length} txn`
            : day.inCurrentMonth
              ? 'No transactions'
              : '';

          return (
            <Tooltip key={day.date} title={tip} arrow enterDelay={400}>
              <Box
                component="button"
                type="button"
                onClick={() => onSelectDay(day)}
                aria-label={`${day.date}${day.hasActivity ? `, ${day.transactions.length} transactions` : ''}`}
                sx={{
                  appearance: 'none',
                  border: getDayBorder(day, selected),
                  borderRadius: { xs: 1.5, sm: 2 },
                  minHeight: { xs: 64, sm: 92, md: 108 },
                  p: { xs: 0.75, sm: 1 },
                  textAlign: 'left',
                  cursor: 'pointer',
                  bgcolor: getDayBackground(day),
                  opacity: day.inCurrentMonth ? 1 : 0.38,
                  transition: 'transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: 'text.primary',
                  font: 'inherit',
                  '&:hover': {
                    transform: day.inCurrentMonth ? 'translateY(-1px)' : 'none',
                    boxShadow: day.inCurrentMonth ? '0 4px 12px rgba(15, 23, 42, 0.08)' : 'none',
                    borderColor: day.inCurrentMonth ? '#94a3b8' : undefined,
                  },
                  '&:focus-visible': {
                    outline: '2px solid #3b82f6',
                    outlineOffset: 2,
                  },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box
                    sx={{
                      width: { xs: 24, sm: 28 },
                      height: { xs: 24, sm: 28 },
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: day.isToday ? 'secondary.main' : 'transparent',
                      color: day.isToday ? '#fff' : day.isWeekend ? 'text.secondary' : 'text.primary',
                      fontWeight: 700,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    {day.dateObj.getDate()}
                  </Box>

                  {day.hasActivity && (
                    <Stack direction="row" spacing={0.4} sx={{ pt: 0.4 }}>
                      {day.expense > 0 && (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />
                      )}
                      {day.income > 0 && (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                      )}
                    </Stack>
                  )}
                </Stack>

                <Box sx={{ display: { xs: 'none', sm: 'block' }, mt: 0.5 }}>
                  {day.expense > 0 && (
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="error.main"
                      sx={{ display: 'block', lineHeight: 1.2 }}
                    >
                      −{formatCurrency(day.expense).replace(/\.00$/, '')}
                    </Typography>
                  )}
                  {day.income > 0 && (
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="success.main"
                      sx={{ display: 'block', lineHeight: 1.2 }}
                    >
                      +{formatCurrency(day.income).replace(/\.00$/, '')}
                    </Typography>
                  )}
                  {!day.hasActivity && day.inCurrentMonth && (
                    <Typography variant="caption" color="text.disabled">
                      —
                    </Typography>
                  )}
                </Box>

                {day.hasActivity && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: { xs: 'block', sm: 'none' }, fontWeight: 600, mt: 0.5 }}
                  >
                    {day.transactions.length}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};
