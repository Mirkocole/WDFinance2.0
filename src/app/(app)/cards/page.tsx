'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPaymentMethods, addPaymentMethod, deletePaymentMethod } from '@/lib/database';
import type { PaymentMethod, PaymentMethodType } from '@/types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Button, IconButton, CircularProgress, Alert
} from '@mui/material';
import { RiAddLine, RiDeleteBinLine, RiBankCardLine, RiMoneyDollarCircleLine, RiWallet3Line, RiMailSendLine, RiRefreshLine } from 'react-icons/ri';
import dayjs from 'dayjs';

const fmt = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const ICONS: Record<PaymentMethodType, React.ReactNode> = {
  credit: <RiBankCardLine size={24} className="text-blue-400" />,
  debit: <RiBankCardLine size={24} className="text-emerald-400" />,
  cash: <RiMoneyDollarCircleLine size={24} className="text-yellow-400" />
};

const LABELS: Record<PaymentMethodType, string> = {
  credit: 'Carta di Credito',
  debit: 'Carta di Debito / Prepagata',
  cash: 'Contanti'
};

const emptyForm = (): Omit<PaymentMethod, 'id' | 'userId' | 'createdAt'> => ({
  name: '',
  type: 'debit',
  balance: 0,
});

export default function CardsPage() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getPaymentMethods(user.id);
    setMethods(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const totalBalance = methods.reduce((s, m) => s + m.balance, 0);

  const openAdd = () => {
    setForm(emptyForm());
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Il nome della carta è obbligatorio.');
      return;
    }
    setSaving(true);
    try {
      await addPaymentMethod(user!.id, form);
      setDialogOpen(false);
      await load();
    } catch {
      setError('Errore nel salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncEmail = async () => {
    setSyncing(true);
    setSyncResult(null);
    setError('');
    try {
      const res = await fetch('/api/bank/sync-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSyncResult({ count: data.count });
      if (data.count > 0) {
        // Potremmo voler ricaricare le spese se fossimo nella pagina spese, 
        // qui mostriamo solo il successo.
      }
    } catch (err: any) {
      console.error(err);
      setError('Errore durante la sincronizzazione: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa carta? I pagamenti associati non avranno più un metodo collegato.')) return;
    await deletePaymentMethod(id);
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <RiWallet3Line className="text-blue-400" /> Carte e Conti
          </h2>
          <p className="text-[#8b9ccc] text-sm mt-1">Gestisci i tuoi metodi di pagamento</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncEmail}
            disabled={syncing}
            className="flex items-center gap-2 bg-[#1e2235] border border-[#2a3050] hover:border-blue-500/50 text-[#8b9ccc] hover:text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            {syncing ? <CircularProgress size={18} color="inherit" /> : <RiMailSendLine size={18} />}
            {syncing ? 'Sincronizzazione...' : 'Sincronizza Email'}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            <RiAddLine size={18} /> Nuova Carta
          </button>
        </div>
      </div>

      {syncResult && (
        <Alert severity="success" sx={{ borderRadius: 3, mb: 3, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }} icon={<RiRefreshLine />}>
          Sincronizzazione completata! Trovate <strong>{syncResult.count}</strong> nuove spese nelle tue email.
        </Alert>
      )}

      <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-5 mb-6 inline-block">
        <p className="text-[#8b9ccc] text-xs mb-1">Saldo Totale Disponibile</p>
        <p className="text-3xl font-bold text-white">{fmt(totalBalance)}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><CircularProgress sx={{ color: '#4f8ef7' }} /></div>
      ) : methods.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#2a3050] rounded-2xl">
          <div className="text-6xl mb-4 text-[#8b9ccc]">💳</div>
          <p className="text-[#8b9ccc]">Nessuna carta o conto collegato.</p>
          <button onClick={openAdd} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            + Aggiungi la tua prima carta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {methods.map(method => (
            <div
              key={method.id}
              className="relative overflow-hidden bg-gradient-to-br from-[#1e2235] to-[#151828] border border-[#2a3050] hover:border-[#3a4060] rounded-2xl p-6 transition-all group shadow-xl"
            >
              {/* Decorazione carta di credito */}
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-5 rounded-full blur-xl pointer-events-none"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500 opacity-5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="p-2 bg-[#2a3050] rounded-xl">
                  {ICONS[method.type]}
                </div>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(method.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  sx={{ color: '#8b9ccc', '&:hover': { color: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)' } }}
                >
                  <RiDeleteBinLine size={16} />
                </IconButton>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-1">{method.name}</h3>
                <p className="text-xs text-[#8b9ccc] uppercase tracking-wider">{LABELS[method.type]}</p>
              </div>

              <div className="mt-6">
                <p className="text-[#8b9ccc] text-xs mb-1">Saldo attuale</p>
                <p className="text-2xl font-bold text-white">{fmt(method.balance)}</p>
              </div>
              
              <p className="text-[10px] text-[#4a5578] mt-4">Aggiunta il {dayjs(method.createdAt).format('DD/MM/YYYY')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Aggiunta */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nuova Carta o Conto</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Nome (es. Intesa, Satispay)"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            autoFocus
          />
          <TextField
            fullWidth
            select
            label="Tipo"
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as PaymentMethodType }))}
          >
            <MenuItem value="debit">Carta di Debito / Conto / Prepagata</MenuItem>
            <MenuItem value="credit">Carta di Credito</MenuItem>
            <MenuItem value="cash">Portafoglio (Contanti)</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Saldo Iniziale (€)"
            type="number"
            value={form.balance || ''}
            onChange={e => setForm(f => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
            slotProps={{ htmlInput: { step: 0.01 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#8b9ccc' }}>Annulla</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ background: 'linear-gradient(135deg,#4f8ef7,#a78bfa)', '&:hover': { background: 'linear-gradient(135deg,#3b7ef5,#9771f5)' } }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Aggiungi'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
