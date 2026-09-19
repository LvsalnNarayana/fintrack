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
  FormHelperText,
} from '@mui/material';
import { CheckCircleOutline as CheckCircleOutlineIcon } from '@mui/icons-material';
import { PageHeader } from '@/components/common/PageHeader';
import { FileDropzone } from '../components/FileDropzone';
import { ColumnMappingTable } from '../components/ColumnMappingTable';
import { ImportPreviewTable } from '../components/ImportPreviewTable';
import {
  ColumnMapping,
  ParsedStatementRow,
  TargetField,
  ImportBatchResult,
  ImportFormatType,
  IMPORT_FORMAT_OPTIONS,
} from '../types/import.types';
import { parseFileContent, transformRowsWithMapping, RawParseResult } from '../parsers/statementParser';
import { detectColumnMapping, looksLikeFinTrackExport } from '../parsers/statementDetector';
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
  const [importFormat, setImportFormat] = useState<ImportFormatType>('bank_statement');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawResult, setRawResult] = useState<RawParseResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [previewRows, setPreviewRows] = useState<ParsedStatementRow[]>([]);
  const [importResult, setImportResult] = useState<ImportBatchResult | null>(null);
  const [formatHint, setFormatHint] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (accounts.length === 1 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const handleFileSelected = async (file: File) => {
    if (!selectedAccountId) {
      setError('Please select an account before uploading.');
      return;
    }

    setLoading(true);
    setError(null);
    setFormatHint(null);
    try {
      setSelectedFile(file);
      const parsed = await parseFileContent(file);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        throw new Error('The uploaded statement is empty or formatted incorrectly.');
      }

      let formatToUse = importFormat;
      const looksFinTrack = looksLikeFinTrackExport(parsed.headers);

      if (looksFinTrack && importFormat === 'bank_statement') {
        formatToUse = 'fintrack_export';
        setImportFormat('fintrack_export');
        setFormatHint('Detected a FinTrack export CSV — switched import type automatically.');
      } else if (!looksFinTrack && importFormat === 'fintrack_export') {
        setFormatHint('Headers look like a bank statement. You can switch Import type if mappings look wrong.');
      }

      const detectedMappings = detectColumnMapping(parsed.headers, formatToUse);
      setRawResult(parsed);
      setMappings(detectedMappings);
      setActiveStep(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFormatChange = (nextFormat: ImportFormatType) => {
    setImportFormat(nextFormat);
    setFormatHint(null);
    if (rawResult) {
      setMappings(detectColumnMapping(rawResult.headers, nextFormat));
    }
  };

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

  const resetWizard = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setRawResult(null);
    setMappings([]);
    setPreviewRows([]);
    setImportResult(null);
    setFormatHint(null);
    setError(null);
  };

  const selectedFormatMeta = IMPORT_FORMAT_OPTIONS.find((opt) => opt.value === importFormat);

  return (
    <Box>
      <PageHeader
        title="Import Transactions"
        subtitle="Import a bank statement or a FinTrack-exported CSV with categories and notes"
      />

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

      {formatHint && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setFormatHint(null)}>
          {formatHint}
        </Alert>
      )}

      {activeStep === 0 && (
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  maxWidth: 720,
                }}
              >
                <FormControl size="small" fullWidth required>
                  <InputLabel>Import type</InputLabel>
                  <Select
                    value={importFormat}
                    label="Import type"
                    onChange={(e) => handleImportFormatChange(e.target.value as ImportFormatType)}
                  >
                    {IMPORT_FORMAT_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{selectedFormatMeta?.description}</FormHelperText>
                </FormControl>

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
                  <FormHelperText>
                    {importFormat === 'fintrack_export'
                      ? 'Rows are imported into this account (Account/Bank columns in the file are ignored).'
                      : 'Bank statement rows are imported into this account.'}
                  </FormHelperText>
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

      {activeStep === 1 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ mb: 2.5 }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Verify Column Mappings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {importFormat === 'fintrack_export'
                    ? 'FinTrack export fields (Type, Category, Notes, Amount) should map automatically.'
                    : 'Check that detected bank columns align with FinTrack ledger fields.'}
                </Typography>
              </Box>

              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Import type</InputLabel>
                <Select
                  value={importFormat}
                  label="Import type"
                  onChange={(e) => handleImportFormatChange(e.target.value as ImportFormatType)}
                >
                  {IMPORT_FORMAT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <ColumnMappingTable
              mappings={mappings}
              importFormat={importFormat}
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
              <Button variant="outlined" onClick={resetWizard}>
                Import Another File
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
