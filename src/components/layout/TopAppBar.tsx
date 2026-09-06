import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Container,
  Chip,
  Stack,
} from '@mui/material';
import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Add as AddIcon,
  SettingsOutlined as SettingsOutlinedIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface TopAppBarProps {
  onOpenAddModal: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Import', path: '/import/upload' },
];

export const TopAppBar: React.FC<TopAppBarProps> = ({ onOpenAddModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConfigured } = useAuth();

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64, justifyContent: 'space-between' }}>
          {/* Brand Logo */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 4 }}
            onClick={() => navigate('/dashboard')}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.5,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
              }}
            >
              <AccountBalanceWalletIcon fontSize="small" />
            </Box>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              FinTrack
            </Typography>
            {!isConfigured && (
              <Chip
                label="Demo Mode"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ ml: 1.5, height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>

          {/* Desktop Nav Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: isActive ? 'primary.main' : 'text.secondary',
                    fontWeight: isActive ? 600 : 400,
                    backgroundColor: isActive ? '#f1f5f9' : 'transparent',
                    '&:hover': { backgroundColor: '#f1f5f9' },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* Actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={onOpenAddModal}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Add
            </Button>
            <IconButton
              size="small"
              onClick={() => navigate('/settings')}
              sx={{ color: 'text.secondary' }}
            >
              <SettingsOutlinedIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

