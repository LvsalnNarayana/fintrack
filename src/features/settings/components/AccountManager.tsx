import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { CreditCard as CreditCardIcon } from '@mui/icons-material';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useBanks } from '@/features/banks/hooks/useBanks';
import { AccountType } from '@/types/domain.types';
import { formatCurrency } from '@/lib/utils/currency';

export const AccountManager: React.FC = () => {
  const { accounts, createAccount, updateAccountBalance, toggleActive } = useAccounts(false);
  const { banks } = useBanks();

  const requiredPassword = import.meta.env.VITE_SETTINGS_PASSWORD || 'fintrack123';

  const [name, setName] = useState('');
  const [bankId, setBankId] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('SAVINGS');
  const [accountNumberMask, setAccountNumberMask] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Default bank
  React.useEffect(() => {
    if (banks.length > 0 && !bankId) {
      setBankId(banks[0].id);
    }
  }, [banks, bankId]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bankId) return;

    setLoading(true);
    setError(null);
    try {
      await createAccount({
        bankId,
        name: name.trim(),
        accountType,
        accountNumberMask: accountNumberMask.trim() || undefined,
        openingBalance: parseFloat(openingBalance) || 0,
      });
      setName('');
      setAccountNumberMask('');
      setOpeningBalance('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!editingAccountId) return;
    const numericBalance = Number(newBalance);

    if (Number.isNaN(numericBalance)) {
      setError('Please enter a valid balance');
      return;
    }

    if (password !== requiredPassword) {
      setError('Incorrect password. Enter the configured settings password to edit the account total.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateAccountBalance({
        id: editingAccountId,
        openingBalance: numericBalance,
      });
      setEditingAccountId(null);
      setNewBalance('');
      setPassword('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update account total');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Bank Accounts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage accounts linked to your institutions
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Add Account Form */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Add New Account
        </Typography>
        <Box component="form" onSubmit={handleAddAccount}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: 160 }} required>
                <InputLabel>Bank</InputLabel>
                <Select
                  value={bankId}
                  label="Bank"
                  onChange={(e) => setBankId(e.target.value)}
                >
                  {banks.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Account Name"
                placeholder="e.g. Salary, Household, Emergency"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
              />

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={accountType}
                  label="Type"
                  onChange={(e) => setAccountType(e.target.value as AccountType)}
                >
                  <MenuItem value="SAVINGS">Savings</MenuItem>
                  <MenuItem value="SALARY">Salary</MenuItem>
                  <MenuItem value="CURRENT">Current</MenuItem>
                  <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                label="Last 4 digits (optional)"
                placeholder="e.g. XX1234"
                value={accountNumberMask}
                onChange={(e) => setAccountNumberMask(e.target.value)}
              />

              <TextField
                size="small"
                label="Opening Balance"
                type="number"
                placeholder="0.00"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading || banks.length === 0}
              >
                Create Account
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      {/* Account List */}
      <Paper variant="outlined">
        <List disablePadding>
          {accounts.map((acc, idx) => (
            <ListItem
              key={acc.id}
              divider={idx < accounts.length - 1}
              secondaryAction={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setEditingAccountId(acc.id);
                      setNewBalance(String(acc.openingBalance));
                      setPassword('');
                      setError(null);
                    }}
                  >
                    Edit total
                  </Button>
                  <Button
                    size="small"
                    color={acc.isActive ? 'inherit' : 'primary'}
                    onClick={() => toggleActive({ id: acc.id, isActive: !acc.isActive })}
                  >
                    {acc.isActive ? 'Archive' : 'Activate'}
                  </Button>
                </Stack>
              }
            >
              <CreditCardIcon sx={{ color: 'text.secondary', mr: 2 }} />
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>
                      {acc.name}
                    </Typography>
                    <Chip label={acc.accountType} size="small" sx={{ height: 20 }} />
                    {!acc.isActive && (
                      <Chip label="Archived" size="small" color="default" sx={{ height: 20 }} />
                    )}
                  </Stack>
                }
                secondary={`${acc.bankName} • Current total: ${formatCurrency(acc.openingBalance, acc.currency)}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={Boolean(editingAccountId)} onClose={() => setEditingAccountId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust account total</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="New total"
              type="number"
              fullWidth
              size="small"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
            />

            <TextField
              label="Settings password"
              type="password"
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingAccountId(null)} disabled={loading}>Cancel</Button>
          <Button onClick={handleBalanceUpdate} variant="contained" disabled={loading}>
            Save total
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

