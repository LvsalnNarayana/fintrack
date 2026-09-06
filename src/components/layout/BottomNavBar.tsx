import React from 'react';
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import {
  DashboardOutlined as DashboardOutlinedIcon,
  ReceiptLongOutlined as ReceiptLongOutlinedIcon,
  BarChartOutlined as BarChartOutlinedIcon,
  SettingsOutlined as SettingsOutlinedIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.startsWith('/transactions')) return 1;
    if (path.startsWith('/analytics')) return 2;
    if (path.startsWith('/settings')) return 3;
    return 0; // default to dashboard
  };

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/dashboard');
        break;
      case 1:
        navigate('/transactions');
        break;
      case 2:
        navigate('/analytics');
        break;
      case 3:
        navigate('/settings');
        break;
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        display: { xs: 'block', md: 'none' },
        borderTop: '1px solid #e2e8f0',
      }}
      elevation={3}
    >
      <BottomNavigation value={getCurrentTab()} onChange={handleChange} showLabels>
        <BottomNavigationAction label="Home" icon={<DashboardOutlinedIcon />} />
        <BottomNavigationAction label="Ledger" icon={<ReceiptLongOutlinedIcon />} />
        <BottomNavigationAction label="Analytics" icon={<BarChartOutlinedIcon />} />
        <BottomNavigationAction label="Settings" icon={<SettingsOutlinedIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

