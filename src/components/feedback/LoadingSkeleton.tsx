import React from 'react';
import { Box, Skeleton, Stack, Card, CardContent } from '@mui/material';

interface LoadingSkeletonProps {
  type?: 'cards' | 'table' | 'metrics';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'cards',
  count = 4,
}) => {
  if (type === 'metrics') {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent sx={{ p: 2 }}>
              <Skeleton width="40%" height={20} />
              <Skeleton width="70%" height={36} sx={{ my: 1 }} />
              <Skeleton width="50%" height={16} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  if (type === 'table') {
    return (
      <Stack spacing={1.5}>
        <Skeleton variant="rectangular" height={44} sx={{ borderRadius: 1 }} />
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={52} sx={{ borderRadius: 1 }} />
        ))}
      </Stack>
    );
  }

  // Default 'cards'
  return (
    <Stack spacing={1.5}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Skeleton width="30%" height={20} />
              <Skeleton width="20%" height={20} />
            </Box>
            <Skeleton width="60%" height={24} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Skeleton width="25%" height={16} />
              <Skeleton width="25%" height={16} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

