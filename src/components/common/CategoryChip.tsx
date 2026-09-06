import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface CategoryChipProps extends Omit<ChipProps, 'color'> {
  name: string;
  color?: string;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  name,
  color = '#64748B',
  size = 'small',
  sx,
  ...props
}) => {
  return (
    <Chip
      label={name}
      size={size}
      sx={{
        backgroundColor: `${color}18`, // 10% opacity background
        color: color,
        border: `1px solid ${color}35`,
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 22,
        ...sx,
      }}
      {...props}
    />
  );
};

