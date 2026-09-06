import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { TransactionType, CreateTransactionDTO } from '@/types/domain.types';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { formatIsoDate } from '@/lib/utils/date';

interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateTransactionDTO) => Promise<unknown>;
}

export const TransactionFormDialog: React.FC<TransactionFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { accounts } = useAccounts(true);
  const { categories } = useCategories();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(formatIsoDate(new Date()));
  const [accountId, setAccountId] = useState<string>('');
  const [transferDestinationAccountId, setTransferDestinationAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set default account when list loads
  React.useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!accountId) {
      setError('Please select an account');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }
    if (type === 'TRANSFER' && transferDestinationAccountId === accountId) {
      setError('Source and Destination accounts cannot be the same');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        accountId,
        categoryId: categoryId || null,
        date,
        description: description.trim(),
        amount: numAmount,
        transactionType: type,
        notes: notes.trim() || null,
        transferDestinationAccountId: type === 'TRANSFER' ? transferDestinationAccountId : undefined,
      });

      // Reset form & close
      setAmount('');
      setDescription('');
      setNotes('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    type === 'TRANSFER' ? true : c.type === type
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>Add Transaction</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            {/* Type Toggle */}
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, newType) => {
                if (newType) {
                  setType(newType);
                  setCategoryId('');
                }
              }}
              fullWidth
              size="small"
            >
              <ToggleButton value="EXPENSE" color="error">
                Expense
              </ToggleButton>
              <ToggleButton value="INCOME" color="success">
                Income
              </ToggleButton>
              <ToggleButton value="TRANSFER" color="info">
                Transfer
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Amount and Date */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Amount"
                type="number"
                required
                fullWidth
                size="small"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  inputProps: { min: 0.01, step: 'any' },
                }}
              />

              <TextField
                label="Date"
                type="date"
                required
                fullWidth
                size="small"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            {/* Account Selector */}
            <FormControl size="small" fullWidth required>
              <InputLabel>{type === 'TRANSFER' ? 'From Account' : 'Account'}</InputLabel>
              <Select
                value={accountId}
                label={type === 'TRANSFER' ? 'From Account' : 'Account'}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.bankName} — {acc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* If Transfer: Destination Account */}
            {type === 'TRANSFER' && (
              <FormControl size="small" fullWidth required>
                <InputLabel>To Account</InputLabel>
                <Select
                  value={transferDestinationAccountId}
                  label="To Account"
                  onChange={(e) => setTransferDestinationAccountId(e.target.value)}
                >
                  {accounts
                    .filter((acc) => acc.id !== accountId)
                    .map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.bankName} — {acc.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}

            {/* Category Selector (Optional for Transfers) */}
            {type !== 'TRANSFER' && (
              <FormControl size="small" fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryId}
                  label="Category"
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <MenuItem value="">Uncategorized</MenuItem>
                  {filteredCategories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Description / Narration */}
            <TextField
              label="Transaction Description"
              required
              fullWidth
              size="small"
              placeholder="e.g. Swiggy, Salary, Grocery run"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Notes */}
            <TextField
              label="Notes (optional)"
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Add optional context or tags"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={18} color="inherit" />}
          >
            Save Transaction
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

