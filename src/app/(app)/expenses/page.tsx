'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getExpenses, addExpense, updateExpense, deleteExpense, getPaymentMethods } from '@/lib/database';
import type { Expense, TransactionCategory, PaymentMethod } from '@/types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Button, IconButton, Tabs, Tab, CircularProgress, Alert,
} from '@mui/material';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiRepeatLine, RiFlashlightLine } from 'react-icons/ri';
import dayjs from 'dayjs';

const CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'housing', label: '🏠 Abitazione' },
  { value: 'food', label: '🍔 Cibo & Ristorazione' },
  { value: 'transport', label: '🚗 Trasporti' },
  { value: 'health', label: '❤️ Salute' },
  { value: 'entertainment', label: '🎮 Intrattenimento' },
  { value: 'utilities', label: '💡 Utenze' },
  { value: 'clothing', label: '👗 Abbigliamento' },
  { value: 'education', label: '📚 Formazione' },
  { value: 'savings', label: '💰 Risparmio' },
  { value: 'other', label: '📦 Altro' },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const empty = (): Omit<Expense, 'id' | 'userId' | 'createdAt'> => ({
  name: '',
  amount: 0,
  category: 'other',
  type: 'sporadic',
  date: dayjs().format('YYYY-MM-DD'),
  endDate: '',
  paymentMethodId: '',
  note: '',
});

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<0 | 1>(0); // 0=recurring, 1=sporadic
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [expensesData, methodsData] = await Promise.all([
      getExpenses(user.id),
      getPaymentMethods(user.id)
    ]);
    setExpenses(expensesData);
    setPaymentMethods(methodsData);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = expenses.filter(e => e.type === (tab === 0 ? 'recurring' : 'sporadic'));
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...empty(), type: tab === 0 ? 'recurring' : 'sporadic' });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({ 
      name: e.name, 
      amount: e.amount, 
      category: e.category, 
      type: e.type, 
      date: e.date, 
      endDate: e.endDate ?? '', 
      paymentMethodId: e.paymentMethodId ?? '',
      note: e.note ?? '' 
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.amount <= 0) {
      setError('Nome e importo sono obbligatori.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.endDate || payload.type === 'sporadic') {
        delete payload.endDate;
      }
      if (!payload.paymentMethodId) {
        delete payload.paymentMethodId;
      }
      
      if (editing) {
        await updateExpense(editing.id, payload);
      } else {
        await addExpense(user!.id, payload);
      }
      setDialogOpen(false);
      await load();
    } catch {
      setError('Errore nel salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa spesa?')) return;
    await deleteExpense(id);
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Spese</h2>
          <p className="text-[#8b9ccc] text-sm mt-1">Gestisci le tue uscite finanziarie</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
        >
          <RiAddLine size={18} /> Aggiungi
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl overflow-hidden">
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid #2a3050',
            '& .MuiTab-root': { color: '#8b9ccc', textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: '#4f8ef7 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#4f8ef7' },
          }}
        >
          <Tab icon={<RiRepeatLine />} iconPosition="start" label="Ricorrenti" />
          <Tab icon={<RiFlashlightLine />} iconPosition="start" label="Sporadiche" />
        </Tabs>

        {/* Summary */}
        <div className="px-6 py-4 border-b border-[#2a3050]">
          <div className="flex items-center justify-between">
            <span className="text-[#8b9ccc] text-sm">{filtered.length} {tab === 0 ? 'spese ricorrenti' : 'spese sporadiche'}</span>
            <span className="text-red-400 font-bold text-lg">{fmt(total)}</span>
          </div>
        </div>

        {/* List */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#4f8ef7' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">💸</div>
              <p className="text-[#8b9ccc] text-sm">Nessuna spesa {tab === 0 ? 'ricorrente' : 'sporadica'}</p>
              <button onClick={openAdd} className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                + Aggiungi la prima
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(e => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-4 bg-[#1e2235] hover:bg-[#252a3d] rounded-xl border border-[#2a3050] hover:border-[#3a4060] transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{e.name}</p>
                      <span className="text-[10px] bg-[#2a3050] text-[#8b9ccc] px-2 py-0.5 rounded-full capitalize">
                        {CATEGORIES.find(c => c.value === e.category)?.label ?? e.category}
                      </span>
                    </div>
                    <p className="text-[#8b9ccc] text-xs mt-0.5">
                      {dayjs(e.date).format('DD/MM/YYYY')}
                      {e.type === 'recurring' && e.endDate ? ` → Fino al ${dayjs(e.endDate).format('DD/MM/YYYY')}` : ''}
                      {e.paymentMethodId && (
                        <span className="ml-2 text-blue-400">
                          💳 {paymentMethods.find(m => m.id === e.paymentMethodId)?.name ?? 'Carta rimossa'}
                        </span>
                      )}
                      {e.note ? ` · ${e.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-red-400 font-bold text-sm">{fmt(e.amount)}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton size="small" onClick={() => openEdit(e)} sx={{ color: '#8b9ccc', '&:hover': { color: '#4f8ef7' } }}>
                        <RiPencilLine size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(e.id)} sx={{ color: '#8b9ccc', '&:hover': { color: '#f87171' } }}>
                        <RiDeleteBinLine size={16} />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {editing ? 'Modifica Spesa' : 'Nuova Spesa'}
        </DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }}>{error}</Alert>}
          <TextField fullWidth label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <TextField fullWidth label="Importo (€)" type="number" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} required slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
          <TextField fullWidth select label="Categoria" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TransactionCategory }))}>
            {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Metodo di Pagamento (opzionale)" value={form.paymentMethodId} onChange={e => setForm(f => ({ ...f, paymentMethodId: e.target.value }))}>
            <MenuItem value=""><em>Nessuno</em></MenuItem>
            {paymentMethods.map(m => (
              <MenuItem key={m.id} value={m.id}>
                {m.type === 'cash' ? '💵' : '💳'} {m.name} ({fmt(m.balance)})
              </MenuItem>
            ))}
          </TextField>
          <TextField fullWidth select label="Tipo" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'recurring' | 'sporadic' }))}>
            <MenuItem value="recurring">🔄 Ricorrente</MenuItem>
            <MenuItem value="sporadic">⚡ Sporadica</MenuItem>
          </TextField>
          <TextField fullWidth label={form.type === 'recurring' ? "Data di inizio" : "Data"} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          {form.type === 'recurring' && (
            <TextField fullWidth label="Scadenza (opzionale)" type="date" value={form.endDate || ''} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          )}
          <TextField fullWidth label="Note (opzionale)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#8b9ccc' }}>Annulla</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{ background: 'linear-gradient(135deg,#4f8ef7,#a78bfa)', '&:hover': { background: 'linear-gradient(135deg,#3b7ef5,#9771f5)' } }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : editing ? 'Aggiorna' : 'Aggiungi'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
