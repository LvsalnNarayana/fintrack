import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Typography,
  Alert,
  Stack,
  Button,
} from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { BankManager } from '../components/BankManager';
import { AccountManager } from '../components/AccountManager';
import { CategoryManager } from '../components/CategoryManager';
import { ImportHistory } from '../components/ImportHistory';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const SettingsPage: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const { isConfigured, user, signOut } = useAuth();

  return (
    <Box>
      <PageHeader
        title="Settings"
        subtitle="Manage institutions, accounts, taxonomy, and system preferences"
      />

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Accounts" />
          <Tab label="Banks" />
          <Tab label="Categories" />
          <Tab label="Import Batches" />
          <Tab label="Database & Auth" />
        </Tabs>
      </Paper>

      {tabIndex === 0 && <AccountManager />}
      {tabIndex === 1 && <BankManager />}
      {tabIndex === 2 && <CategoryManager />}
      {tabIndex === 3 && <ImportHistory />}

      {tabIndex === 4 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Hosted Supabase Configuration
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              {isConfigured ? (
                <Alert severity="success">
                  Connected to Hosted Supabase Database. All transactions, accounts, and categories are synchronizing live.
                </Alert>
              ) : (
                <Alert severity="warning">
                  Running in <strong>Demo Preview Mode</strong>. To connect your hosted Supabase instance, update <code>.env</code> or your Vercel Project Settings with <code>VITE_SUPABASE_URL</code> and either <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> or <code>VITE_SUPABASE_ANON_KEY</code>.
                </Alert>
              )}

              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Current User</Typography>
                <Typography variant="body2" fontWeight={600}>{user?.user_metadata?.username || 'Not authenticated'}</Typography>
              </Box>

              <Box>
                <Button variant="outlined" color="error" onClick={signOut}>
                  Sign Out
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

