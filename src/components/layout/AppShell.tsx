import React, { useState } from 'react';
import { Box, Container, Fab } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Outlet } from 'react-router-dom';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';
import { TransactionFormDialog } from '@/features/transactions/components/TransactionFormDialog';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';

export const AppShell: React.FC = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { createTransaction } = useTransactions();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopAppBar onOpenAddModal={() => setIsAddOpen(true)} />

      <Container
        maxWidth="lg"
        component="main"
        sx={{
          flex: 1,
          py: { xs: 2.5, md: 4 },
          pb: { xs: 10, md: 4 }, // extra bottom padding on mobile for BottomNav
        }}
      >
        <Outlet />
      </Container>

      {/* Mobile Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add transaction"
        onClick={() => setIsAddOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 76, // slightly above the 56px bottom navigation
          right: 20,
          display: { xs: 'flex', md: 'none' },
          zIndex: 1050,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <AddIcon />
      </Fab>

      {/* Mobile Bottom Navigation */}
      <BottomNavBar />

      {/* Global Quick Add Transaction Dialog */}
      <TransactionFormDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={createTransaction}
      />
    </Box>
  );
};

