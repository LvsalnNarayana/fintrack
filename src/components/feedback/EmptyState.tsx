import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { FolderOpenOutlined as FolderOpenOutlinedIcon } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 6,
        textAlign: 'center',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 260,
      }}
    >
      <Box sx={{ color: 'text.secondary', opacity: 0.6, mb: 1.5 }}>
        {icon || <FolderOpenOutlinedIcon sx={{ fontSize: 48 }} />}
      </Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 2.5 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction} size="small">
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
};

