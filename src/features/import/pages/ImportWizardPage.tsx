import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CheckCircleOutline as CheckCircleOutlineIcon } from '@mui/icons-material';
import { PageHeader } from '@/components/common/PageHeader';
import { FileDropzone } from '../components/FileDropzone';
import { ColumnMappingTable } from '../components/ColumnMappingTable';
import { ImportPreviewTable } from '../components/ImportPreviewTable';
import { ColumnMapping, ParsedStatementRow, TargetField, ImportBatchResult } from '../types/import.types';
import { parseFileContent, transformRowsWithMapping, RawParseResult } from '../parsers/statementParser';
import { detectColumnMapping } from '../parsers/statementDetector';
import { importService } from '../services/importService';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/queryKeys';

const STEPS = ['Upload File', 'Map Columns', 'Preview & Deduplicate', 'Confirmation'];

export const ImportWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accounts } = useAccounts(true);

  const [activeStep, setActiveStep] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawResult, setRawResult] = useState<RawParseResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [previewRows, setPreviewRows] = useState<ParsedStatementRow[]>([]);
  const [importResult, setImportResult] = useState<ImportBatchResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default account
  React.useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Step 1 -> Step 2: Parse File & Detect Columns
  const handleFileSelected = async (file: File) => {
    if (!selectedAccountId) {
      setError('Please select an account before uploading.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setSelectedFile(file);
      const parsed = await parseFileContent(file);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        throw new Error('The uploaded statement is empty or formatted incorrectly.');
      }

      const detectedMappings = detectColumnMapping(parsed.headers);
      setRawResult(parsed);
      setMappings(detectedMappings);
      setActiveStep(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3: Apply Mapping & Run Duplicate Detection
  const handleProceedToPreview = async () => {
    if (!rawResult) return;
    setLoading(true);
    setError(null);

    try {
      const transformed = transformRowsWithMapping(rawResult.rows, mappings);
      const deduplicated = await importService.detectDuplicates(transformed, selectedAccountId);
      setPreviewRows(deduplicated);
      setActiveStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error validating rows');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 -> Step 4: Execute Batch Ingestion
  const handleCommitImport = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);

    try {
      const result = await importService.commitImport(
        selectedAccountId,
        selectedFile.name,
        previewRows
      );
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
      setActiveStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to commit import');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (originalHeader: string, newTarget: TargetField) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.originalHeader === originalHeader ? { ...m, targetField: newTarget } : m
      )
    );
  };

  const handleToggleSkip = (index: number) => {
    setPreviewRows((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, skipImport: !row.skipImport } : row
      )
    );
  };

  return (
    <Box>
      <PageHeader
        title="Import Bank Statement"
        subtitle="Transform raw Excel/CSV statements into structured ledger entries"
      />

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2.5 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step 0: Upload & Account Selection */}
      {activeStep === 0 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Box sx={{ maxWidth: 360 }}>
                <FormControl size="small" fullWidth required>
                  <InputLabel>Destination Account</InputLabel>
                  <Select
                    value={selectedAccountId}
                    label="Destination Account"
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                  >
                    {accounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.bankName} — {acc.name} ({acc.currency})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <FileDropzone onFileSelected={handleFileSelected} />

              {loading && (
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary">
                    Analyzing statement columns...
                  </Typography>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Column Mapping */}
      {activeStep === 1 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Verify Column Mappings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Check that detected statement columns align with FinTrack ledger fields.
            </Typography>

            <ColumnMappingTable
              mappings={mappings}
              onMappingChange={handleMappingChange}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button
                variant="contained"
                onClick={handleProceedToPreview}
                disabled={loading}
              >
                {loading ? 'Checking Duplicates...' : 'Preview Rows'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview & Duplicate Resolution */}
      {activeStep === 2 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Review Ingestion Rows & Duplicates
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Uncheck any rows you wish to exclude. Rows flagged as potential duplicates are skipped by default.
            </Typography>

            <ImportPreviewTable
              rows={previewRows}
              onToggleSkip={handleToggleSkip}
            />

            <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
              <Button onClick={() => setActiveStep(1)}>Back</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCommitImport}
                disabled={loading}
                startIcon={loading && <CircularProgress size={18} color="inherit" />}
              >
                {loading
                  ? 'Importing...'
                  : `Confirm & Ingest (${previewRows.filter((r) => !r.skipImport).length} Rows)`}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirmation Summary */}
      {activeStep === 3 && importResult && (
        <Card>
          <CardContent sx={{ p: 5, textAlign: 'center' }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Import Completed Successfully
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Your transactions have been saved and assigned to your account ledger.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="center"
              sx={{ mb: 4 }}
            >
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, minWidth: 140 }}>
                <Typography variant="caption" color="text.secondary">Total Rows</Typography>
                <Typography variant="h5" fontWeight={700}>{importResult.totalRows}</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, minWidth: 140 }}>
                <Typography variant="caption" color="success.main">Imported</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">{importResult.importedRows}</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, minWidth: 140 }}>
                <Typography variant="caption" color="text.secondary">Skipped Duplicates</Typography>
                <Typography variant="h5" fontWeight={700} color="text.secondary">{importResult.skippedDuplicates}</Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                Import Another Statement
              </Button>
              <Button variant="contained" onClick={() => navigate('/transactions')}>
                View Ledger
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

