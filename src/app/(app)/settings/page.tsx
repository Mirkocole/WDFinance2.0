'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserSettings, updateUserSettings } from '@/lib/database';
import type { UserSettings } from '@/types';
import {
  TextField, Button, CircularProgress, Alert, Card, CardContent, Divider
} from '@mui/material';
import { RiMailSettingsLine, RiShieldKeyholeLine, RiSave3Line } from 'react-icons/ri';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    emailUser: '',
    emailPass: '',
    emailHost: 'imap.gmail.com',
    emailPort: 993,
  });

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const data = await getUserSettings(user.id);
        if (data) {
          setForm({
            emailUser: data.emailUser || '',
            emailPass: data.emailPass || '',
            emailHost: data.emailHost || 'imap.gmail.com',
            emailPort: data.emailPort || 993,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      await updateUserSettings(user.id, form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#4f8ef7' }} /></div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Impostazioni</h2>
        <p className="text-[#8b9ccc] text-sm mt-1">Configura le tue preferenze e integrazioni</p>
      </div>

      <Card sx={{ background: '#181c27', border: '1px solid #2a3050', borderRadius: 4 }}>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <RiMailSettingsLine size={24} />
            </div>
            <div>
              <h3 className="text-white font-semibold">Sincronizzazione Email</h3>
              <p className="text-[#8b9ccc] text-xs">Configura l'accesso IMAP per importare le spese automaticamente</p>
            </div>
          </div>

          <Divider sx={{ borderColor: '#2a3050' }} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              fullWidth
              label="Email"
              placeholder="es. nome@gmail.com"
              value={form.emailUser}
              onChange={e => setForm(f => ({ ...f, emailUser: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Password App"
              type="password"
              placeholder="••••••••••••••••"
              value={form.emailPass}
              onChange={e => setForm(f => ({ ...f, emailPass: e.target.value }))}
              helperText="Usa una password per le app, non la password principale"
            />
            <TextField
              fullWidth
              label="Host IMAP"
              value={form.emailHost}
              onChange={e => setForm(f => ({ ...f, emailHost: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Porta IMAP"
              type="number"
              value={form.emailPort}
              onChange={e => setForm(f => ({ ...f, emailPort: parseInt(e.target.value) || 993 }))}
            />
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex gap-3">
            <RiShieldKeyholeLine size={20} className="text-blue-400 shrink-0" />
            <p className="text-[#8b9ccc] text-xs leading-relaxed">
              <strong>Nota:</strong> I tuoi dati vengono salvati in modo sicuro nel database. Se usi Gmail, devi attivare l'autenticazione a due fattori e generare una "Password per le app" nelle impostazioni del tuo account Google.
            </p>
          </div>

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ borderRadius: 2 }}>Impostazioni salvate con successo!</Alert>}

          <Button
            fullWidth
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <RiSave3Line />}
            sx={{
              py: 1.5,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #4f8ef7, #2563eb)',
              '&:hover': { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }
            }}
          >
            Salva Impostazioni
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
