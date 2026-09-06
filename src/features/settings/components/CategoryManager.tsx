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
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { CategoryChip } from '@/components/common/CategoryChip';
import { CategoryType } from '@/types/domain.types';

const COLOR_PALETTES = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#16A34A',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B',
];

export const CategoryManager: React.FC = () => {
  const { categories, createCategory, archiveCategory } = useCategories(true);
  const [tabType, setTabType] = useState<CategoryType>('EXPENSE');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === tabType);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createCategory({
        name: name.trim(),
        type: tabType,
        color,
      });
      setName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Category Taxonomy
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Organize your income sources and expenditure classifications
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tabs */}
      <Tabs
        value={tabType}
        onChange={(_, val) => setTabType(val)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Expense Categories" value="EXPENSE" />
        <Tab label="Income Categories" value="INCOME" />
      </Tabs>

      {/* Add Category Form */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Add {tabType === 'EXPENSE' ? 'Expense' : 'Income'} Category
        </Typography>
        <Box component="form" onSubmit={handleAddCategory}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="e.g. Subscriptions, Groceries, Dividends"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Color</InputLabel>
              <Select
                value={color}
                label="Color"
                onChange={(e) => setColor(e.target.value)}
              >
                {COLOR_PALETTES.map((c) => (
                  <MenuItem key={c} value={c}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: c,
                          mr: 1,
                        }}
                      />
                      {c}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button type="submit" variant="contained" disabled={loading}>
              Add Category
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Category List */}
      <Paper variant="outlined">
        <List disablePadding>
          {filteredCategories.map((cat, idx) => (
            <ListItem
              key={cat.id}
              divider={idx < filteredCategories.length - 1}
              secondaryAction={
                <Button
                  size="small"
                  color={cat.isArchived ? 'primary' : 'inherit'}
                  onClick={() => archiveCategory({ id: cat.id, isArchived: !cat.isArchived })}
                >
                  {cat.isArchived ? 'Restore' : 'Archive'}
                </Button>
              }
            >
              <CategoryChip name={cat.name} color={cat.color} sx={{ mr: 2 }} />
              <ListItemText
                secondary={cat.isArchived ? 'Archived (hidden from pickers)' : 'Active'}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

