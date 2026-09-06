import React, { useRef, useState } from 'react';
import { Typography, Button, Paper } from '@mui/material';
import { CloudUploadOutlined as CloudUploadOutlinedIcon } from '@mui/icons-material';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelected,
  accept = '.csv, .xlsx, .xls',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <Paper
      variant="outlined"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      sx={{
        p: 6,
        textAlign: 'center',
        cursor: 'pointer',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: isDragOver ? 'primary.main' : '#cbd5e1',
        backgroundColor: isDragOver ? '#f1f5f9' : '#ffffff',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: '#f8fafc',
        },
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: 'none' }}
      />
      <CloudUploadOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Choose a bank statement file
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Drag and drop your <strong>.csv</strong> or <strong>.xlsx</strong> statement here, or browse from your device
      </Typography>
      <Button variant="outlined" size="small" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
        Browse Files
      </Button>
    </Paper>
  );
};

