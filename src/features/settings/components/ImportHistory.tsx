import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
} from '@mui/material';
import { DeleteForever as DeleteForeverIcon } from '@mui/icons-material';
import { importService } from '@/features/import/services/importService';
import { ImportBatch } from '@/types/domain.types';
import { formatDateDisplay } from '@/lib/utils/date';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/queryKeys';

export const ImportHistory: React.FC = () => {
  const queryClient = useQueryClient();
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const list = await importService.getImportBatches();
      setBatches(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleRollback = async (batchId: string, fileName: string) => {
    if (
      window.confirm(
        `Are you sure you want to rollback "${fileName}"? All transactions imported in this batch will be permanently deleted.`
      )
    ) {
      try {
        await importService.rollbackBatch(batchId);
        setMessage(`Successfully rolled back statement: ${fileName}`);
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
        await fetchBatches();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Rollback failed');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Import Batches & Rollbacks
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Inspect statement files uploaded to FinTrack. You can rollback accidental or incorrect imports.
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Imported Date</TableCell>
              <TableCell align="right">Rows Ingested</TableCell>
              <TableCell align="right">Duplicates Skipped</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {batch.sourceFileName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateDisplay(batch.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={500}>
                    {batch.importedRows}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    {batch.skippedDuplicates}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                    onClick={() => handleRollback(batch.id, batch.sourceFileName)}
                  >
                    Rollback
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No import batches found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

