import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Stack,
  Alert,
} from '@mui/material';
import { DeleteOutline as DeleteOutlineIcon, AccountBalance as AccountBalanceIcon } from '@mui/icons-material';
import { useBanks } from '@/features/banks/hooks/useBanks';

export const BankManager: React.FC = () => {
  const { banks, createBank, deleteBank } = useBanks();
  const [bankName, setBankName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createBank(bankName.trim());
      setBankName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add bank');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This requires no active accounts exist under it.`)) {
      try {
        await deleteBank(id);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Cannot delete bank with active accounts');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Banks & Financial Institutions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage institutions that hold your accounts
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Add Bank Form */}
      <Box component="form" onSubmit={handleAddBank} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} maxWidth={400}>
          <TextField
            size="small"
            placeholder="e.g. HDFC Bank, Chase, ICICI"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            fullWidth
            required
          />
          <Button type="submit" variant="contained" disabled={loading}>
            Add Bank
          </Button>
        </Stack>
      </Box>

      {/* Bank List */}
      <Paper variant="outlined">
        <List disablePadding>
          {banks.map((bank, idx) => (
            <ListItem
              key={bank.id}
              divider={idx < banks.length - 1}
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  color="error"
                  onClick={() => handleDelete(bank.id, bank.name)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              }
            >
              <AccountBalanceIcon sx={{ color: 'text.secondary', mr: 2 }} />
              <ListItemText
                primary={bank.name}
                secondary={`Created ${new Date(bank.createdAt).toLocaleDateString()}`}
              />
            </ListItem>
          ))}
          {banks.length === 0 && (
            <ListItem>
              <ListItemText primary="No banks added yet." secondary="Add your first bank above." />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
};

