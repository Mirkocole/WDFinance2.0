'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TextField, Button, Alert, CircularProgress } from '@mui/material';
import { RiWalletLine, RiMailLine, RiLockLine } from 'react-icons/ri';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      const msg = err.message || 'Errore sconosciuto';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Email o password errati.');
      } else if (msg.toLowerCase().includes('already registered')) {
        setError('Email già in uso. Prova ad accedere.');
      } else if (msg.toLowerCase().includes('password should be')) {
        setError('La password deve essere più sicura (almeno 6 caratteri).');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
              <RiWalletLine size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">WDFinance</h1>
            <p className="text-[#8b9ccc] text-sm mt-1">
              {isRegister ? 'Crea il tuo account' : 'Accedi al tuo account'}
            </p>
          </div>

          {error && (
            <Alert severity="error" className="mb-4" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              slotProps={{
                input: {
                  startAdornment: <RiMailLine className="mr-2 text-[#8b9ccc]" size={18} />,
                }
              }}
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              slotProps={{
                input: {
                  startAdornment: <RiLockLine className="mr-2 text-[#8b9ccc]" size={18} />,
                }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #4f8ef7 0%, #a78bfa 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #3b7ef5 0%, #9771f5 100%)' },
                py: 1.5,
                mt: 1,
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : isRegister ? 'Registrati' : 'Accedi'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#8b9ccc] text-sm">
              {isRegister ? 'Hai già un account?' : 'Non hai un account?'}{' '}
              <button
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {isRegister ? 'Accedi' : 'Registrati'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
