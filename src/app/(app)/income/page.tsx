'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getIncomes, addIncome, updateIncome, deleteIncome, getPaymentMethods } from '@/lib/database';
import type { Income, TransactionCategory, PaymentMethod } from '@/types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Button, IconButton, Tabs, Tab, CircularProgress, Alert,
} from '@mui/material';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiRepeatLine, RiFlashlightLine } from 'react-icons/ri';
import dayjs from 'dayjs';

const CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'salary', label: '💼 Stipendio' },
  { value: 'freelance', label: '💻 Freelance' },
  { value: 'investment', label: '📈 Investimenti' },
  { value: 'bonus', label: '🎁 Bonus' },
  { value: 'savings', label: '💰 Risparmi' },
  { value: 'other', label: '📦 Altro' },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const empty = (): Omit<Income, 'id' | 'userId' | 'createdAt'> => ({
  name: '',
  amount: 0,
  category: 'salary',
  type: 'recurring',
  date: dayjs().format('YYYY-MM-DD'),
  endDate: '',
  paymentMethodId: '',
  note: '',
});

export default function IncomePage() {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<0 | 1>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [incomesData, methodsData] = await Promise.all([
      getIncomes(user.id),
      getPaymentMethods(user.id)
    ]);
    setIncomes(incomesData);
    setPaymentMethods(methodsData);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = incomes.filter(i => i.type === (tab === 0 ? 'recurring' : 'sporadic'));
  const total = filtered.reduce((s, i) => s + i.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...empty(), type: tab === 0 ? 'recurring' : 'sporadic' });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (i: Income) => {
    setEditing(i);
    setForm({ 
      name: i.name, 
      amount: i.amount, 
      category: i.category, 
      type: i.type, 
      date: i.date, 
      endDate: i.endDate ?? '', 
      paymentMethodId: i.paymentMethodId ?? '',
      note: i.note ?? '' 
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
        await updateIncome(editing.id, payload);
      } else {
        await addIncome(user!.id, payload);
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
    if (!confirm('Eliminare questo guadagno?')) return;
    await deleteIncome(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Guadagni</h2>
          <p className="text-[#8b9ccc] text-sm mt-1">Gestisci le tue entrate finanziarie</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
        >
          <RiAddLine size={18} /> Aggiungi
        </button>
      </div>

      <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl overflow-hidden">
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid #2a3050',
            '& .MuiTab-root': { color: '#8b9ccc', textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: '#34d399 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#34d399' },
          }}
        >
          <Tab icon={<RiRepeatLine />} iconPosition="start" label="Ricorrenti" />
          <Tab icon={<RiFlashlightLine />} iconPosition="start" label="Sporadici" />
        </Tabs>
        <div className="px-6 py-4 border-b border-[#2a3050] flex items-center justify-between">
          <span className="text-[#8b9ccc] text-sm">{filtered.length} voci</span>
          <span className="text-emerald-400 font-bold text-lg">{fmt(total)}</span>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12"><CircularProgress sx={{ color: '#34d399' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">💵</div>
              <p className="text-[#8b9ccc] text-sm">Nessun guadagno {tab === 0 ? 'ricorrente' : 'sporadico'}</p>
              <button onClick={openAdd} className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium">+ Aggiungi il primo</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(i => (
                <div key={i.id} className="flex items-center justify-between p-4 bg-[#1e2235] hover:bg-[#252a3d] rounded-xl border border-[#2a3050] hover:border-[#3a4060] transition-all group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{i.name}</p>
                      <span className="text-[10px] bg-[#2a3050] text-[#8b9ccc] px-2 py-0.5 rounded-full">
                        {CATEGORIES.find(c => c.value === i.category)?.label ?? i.category}
                      </span>
                    </div>
                    <p className="text-[#8b9ccc] text-xs mt-0.5">
                      {dayjs(i.date).format('DD/MM/YYYY')}
                      {i.type === 'recurring' && i.endDate ? ` → Fino al ${dayjs(i.endDate).format('DD/MM/YYYY')}` : ''}
                      {i.paymentMethodId && (
                        <span className="ml-2 text-emerald-400">
                          🏦 {paymentMethods.find(m => m.id === i.paymentMethodId)?.name ?? 'Conto rimosso'}
                        </span>
                      )}
                      {i.note ? ` · ${i.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="text-emerald-400 font-bold text-sm">+{fmt(i.amount)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconButton size="small" onClick={() => openEdit(i)} sx={{ color: '#8b9ccc', '&:hover': { color: '#34d399' } }}>
                        <RiPencilLine size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(i.id)} sx={{ color: '#8b9ccc', '&:hover': { color: '#f87171' } }}>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Modifica Guadagno' : 'Nuovo Guadagno'}</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }}>{error}</Alert>}
          <TextField fullWidth label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <TextField fullWidth label="Importo (€)" type="number" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
          <TextField fullWidth select label="Categoria" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TransactionCategory }))}>
            {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Destinazione (opzionale)" value={form.paymentMethodId} onChange={e => setForm(f => ({ ...f, paymentMethodId: e.target.value }))}>
            <MenuItem value=""><em>Nessuna</em></MenuItem>
            {paymentMethods.map(m => (
              <MenuItem key={m.id} value={m.id}>
                {m.type === 'cash' ? '💵' : '💳'} {m.name} ({fmt(m.balance)})
              </MenuItem>
            ))}
          </TextField>
          <TextField fullWidth select label="Tipo" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'recurring' | 'sporadic' }))}>
            <MenuItem value="recurring">🔄 Ricorrente</MenuItem>
            <MenuItem value="sporadic">⚡ Sporadico</MenuItem>
          </TextField>
          <TextField fullWidth label={form.type === 'recurring' ? "Data di inizio" : "Data"} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          {form.type === 'recurring' && (
            <TextField fullWidth label="Scadenza (opzionale)" type="date" value={form.endDate || ''} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          )}
          <TextField fullWidth label="Note (opzionale)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#8b9ccc' }}>Annulla</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ background: 'linear-gradient(135deg,#34d399,#10b981)', '&:hover': { background: 'linear-gradient(135deg,#2ec48c,#059669)' } }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : editing ? 'Aggiorna' : 'Aggiungi'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
