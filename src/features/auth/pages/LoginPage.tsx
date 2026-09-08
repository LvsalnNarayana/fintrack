import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { AccountBalanceWallet as AccountBalanceWalletIcon } from '@mui/icons-material';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        await authService.signUp(username, password);
        setMessage('Registration successful! You can now sign in with your username.');
      } else {
        await authService.signInWithPassword(username, password);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%', p: 1 }}>
        <CardContent>
          <Stack alignItems="center" spacing={1} mb={3}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: 'primary.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceWalletIcon />
            </Box>
            <Typography variant="h5" fontWeight={700}>
              FinTrack
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Personal Finance Progressive Web App
            </Typography>
          </Stack>

          {!isConfigured && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Hosted Supabase credentials not yet detected in <code>.env</code>. You are currently in <strong>Demo Preview Mode</strong>.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Username"
                type="text"
                fullWidth
                size="small"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                helperText="3-30 characters: letters, numbers, or underscores"
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                size="small"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" justifyContent="center">
            <Button
              variant="text"
              size="small"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </Button>
          </Stack>

          {!isConfigured && (
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate('/dashboard')}
            >
              Enter Demo Mode
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

