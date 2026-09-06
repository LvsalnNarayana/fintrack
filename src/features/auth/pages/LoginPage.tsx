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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        await authService.signUp(email, password);
        setMessage('Registration successful! Please check your email for confirmation link or sign in.');
      } else {
        if (password) {
          await authService.signInWithPassword(email, password);
          navigate('/dashboard');
        } else {
          await authService.signInWithEmail(email);
          setMessage('Magic link sent! Check your inbox to sign in.');
        }
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
                label="Email address"
                type="email"
                fullWidth
                size="small"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Password (optional for Magic Link)"
                type="password"
                fullWidth
                size="small"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText={!password ? 'Leave empty to receive a Magic Link' : ''}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
              >
                {isSignUp ? 'Create Account' : password ? 'Sign In' : 'Send Magic Link'}
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

