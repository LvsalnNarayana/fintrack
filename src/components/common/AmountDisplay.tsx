import React from 'react';
import { Typography, TypographyProps } from '@mui/material';
import { formatAmountWithSign } from '@/lib/utils/currency';
import { TransactionType } from '@/types/domain.types';

interface AmountDisplayProps extends TypographyProps {
  amount: number;
  type: TransactionType;
  currency?: string;
  showSign?: boolean;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  type,
  currency = 'INR',
  showSign = true,
  sx,
  ...props
}) => {
  const isPositive = type === 'INCOME';
  const isNegative = type === 'EXPENSE';

  const color = isPositive
    ? 'success.main'
    : isNegative
    ? 'error.main'
    : 'text.secondary';

  const formatted = showSign
    ? formatAmountWithSign(amount, type, currency)
    : Math.abs(amount).toLocaleString('en-IN', { style: 'currency', currency });

  return (
    <Typography
      component="span"
      sx={{
        fontWeight: 600,
        color,
        fontVariantNumeric: 'tabular-nums',
        ...sx,
      }}
      {...props}
    >
      {formatted}
    </Typography>
  );
};

