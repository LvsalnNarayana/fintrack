import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  loading?: boolean;
  valueColor?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  loading = false,
  valueColor = 'text.primary',
  icon,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
            {label}
          </Typography>
          {icon && (
            <Box sx={{ color: 'text.secondary', opacity: 0.8, display: 'flex' }}>
              {icon}
            </Box>
          )}
        </Box>

        {loading ? (
          <Skeleton variant="text" width="60%" height={38} />
        ) : (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: valueColor,
              letterSpacing: '-0.02em',
              my: 0.5,
            }}
          >
            {value}
          </Typography>
        )}

        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

