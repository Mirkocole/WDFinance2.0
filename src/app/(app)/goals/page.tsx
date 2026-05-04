'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getGoals, addGoal, updateGoal, deleteGoal } from '@/lib/database';
import type { Goal, GoalPriority } from '@/types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Button, IconButton, CircularProgress, Alert, LinearProgress,
} from '@mui/material';
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiFlag2Line, RiCheckboxCircleLine } from 'react-icons/ri';
import dayjs from 'dayjs';

const fmt = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const priorityConfig = {
  high:   { label: 'Alta',   color: '#f87171', bg: '#f8717122', icon: '🔴' },
  medium: { label: 'Media',  color: '#fbbf24', bg: '#fbbf2422', icon: '🟡' },
  low:    { label: 'Bassa',  color: '#34d399', bg: '#34d39922', icon: '🟢' },
};

const priorityOrder: Record<GoalPriority, number> = { high: 0, medium: 1, low: 2 };

const emptyForm = (): Omit<Goal, 'id' | 'userId' | 'createdAt'> => ({
  name: '',
  targetAmount: 0,
  currentAmount: 0,
  priority: 'medium',
  deadline: '',
  note: '',
});

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterPriority, setFilterPriority] = useState<GoalPriority | 'all'>('all');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getGoals(user.id);
    setGoals(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = goals
    .filter(g => filterPriority === 'all' || g.priority === filterPriority)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const completed = goals.filter(g => g.currentAmount >= g.targetAmount).length;
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setForm({ name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount, priority: g.priority, deadline: g.deadline ?? '', note: g.note ?? '' });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.targetAmount <= 0) {
      setError('Nome e importo obiettivo sono obbligatori.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.deadline) delete payload.deadline;
      
      if (editing) {
        await updateGoal(editing.id, payload);
      } else {
        await addGoal(user!.id, payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      setError('Errore nel salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo obiettivo?')) return;
    await deleteGoal(id);
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Obiettivi</h2>
          <p className="text-[#8b9ccc] text-sm mt-1">Raggiungi i tuoi traguardi finanziari</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-yellow-500/20"
        >
          <RiAddLine size={18} /> Nuovo Obiettivo
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-5">
          <p className="text-[#8b9ccc] text-xs mb-1">Totale Obiettivi</p>
          <p className="text-2xl font-bold text-white">{goals.length}</p>
          <p className="text-[#8b9ccc] text-xs mt-1">{completed} completati</p>
        </div>
        <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-5">
          <p className="text-[#8b9ccc] text-xs mb-1">Risparmiato</p>
          <p className="text-2xl font-bold text-emerald-400">{fmt(totalCurrent)}</p>
          <p className="text-[#8b9ccc] text-xs mt-1">su {fmt(totalTarget)}</p>
        </div>
        <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-5">
          <p className="text-[#8b9ccc] text-xs mb-1">Mancanti</p>
          <p className="text-2xl font-bold text-yellow-400">{fmt(Math.max(0, totalTarget - totalCurrent))}</p>
          <p className="text-[#8b9ccc] text-xs mt-1">
            {totalTarget > 0 ? `${Math.round((totalCurrent / totalTarget) * 100)}% completato` : '–'}
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'high', 'medium', 'low'] as const).map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filterPriority === p
                ? 'bg-white/10 border-white/30 text-white'
                : 'border-[#2a3050] text-[#8b9ccc] hover:border-[#3a4060] hover:text-white'
            }`}
          >
            {p === 'all' ? 'Tutti' : `${priorityConfig[p].icon} ${priorityConfig[p].label}`}
          </button>
        ))}
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="flex justify-center py-16"><CircularProgress sx={{ color: '#fbbf24' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-[#8b9ccc]">Nessun obiettivo trovato</p>
          <button onClick={openAdd} className="mt-4 text-yellow-400 hover:text-yellow-300 text-sm font-medium">+ Crea il primo obiettivo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map(goal => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const completed = goal.currentAmount >= goal.targetAmount;
            const cfg = priorityConfig[goal.priority];
            return (
              <div
                key={goal.id}
                className="bg-[#181c27] border border-[#2a3050] hover:border-[#3a4060] rounded-2xl p-6 transition-all group relative overflow-hidden"
              >
                {completed && (
                  <div className="absolute top-3 right-12 text-emerald-400">
                    <RiCheckboxCircleLine size={20} />
                  </div>
                )}
                {/* Priority badge + actions */}
                <div className="flex items-start justify-between mb-4">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon} {cfg.label} priorità
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton size="small" onClick={() => openEdit(goal)} sx={{ color: '#8b9ccc', '&:hover': { color: '#fbbf24' } }}>
                      <RiPencilLine size={15} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(goal.id)} sx={{ color: '#8b9ccc', '&:hover': { color: '#f87171' } }}>
                      <RiDeleteBinLine size={15} />
                    </IconButton>
                  </div>
                </div>

                <h3 className="text-white font-semibold text-base mb-1">{goal.name}</h3>
                {goal.note && <p className="text-[#8b9ccc] text-xs mb-3">{goal.note}</p>}
                {goal.deadline && (
                  <p className="text-[#8b9ccc] text-xs mb-3">📅 Scadenza: {dayjs(goal.deadline).format('DD/MM/YYYY')}</p>
                )}

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-bold">{fmt(goal.currentAmount)}</span>
                    <span className="text-[#8b9ccc] text-sm">{fmt(goal.targetAmount)}</span>
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#2a3050',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: completed
                          ? 'linear-gradient(90deg,#34d399,#10b981)'
                          : `linear-gradient(90deg,${cfg.color},${cfg.color}99)`,
                      },
                    }}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[#8b9ccc] text-xs">{pct}% completato</span>
                    {!completed && (
                      <span className="text-[#8b9ccc] text-xs">mancano {fmt(goal.targetAmount - goal.currentAmount)}</span>
                    )}
                    {completed && <span className="text-emerald-400 text-xs font-bold">✓ Raggiunto!</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Modifica Obiettivo' : 'Nuovo Obiettivo'}</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }}>{error}</Alert>}
          <TextField fullWidth label="Nome obiettivo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <TextField fullWidth label="Importo obiettivo (€)" type="number" value={form.targetAmount || ''} onChange={e => setForm(f => ({ ...f, targetAmount: parseFloat(e.target.value) || 0 }))} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
          <TextField fullWidth label="Importo attuale (€)" type="number" value={form.currentAmount || ''} onChange={e => setForm(f => ({ ...f, currentAmount: parseFloat(e.target.value) || 0 }))} slotProps={{ htmlInput: { min: 0, step: 0.01 } }} />
          <TextField fullWidth select label="Priorità" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as GoalPriority }))}>
            <MenuItem value="high">🔴 Alta</MenuItem>
            <MenuItem value="medium">🟡 Media</MenuItem>
            <MenuItem value="low">🟢 Bassa</MenuItem>
          </TextField>
          <TextField fullWidth label="Scadenza (opzionale)" type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField fullWidth label="Note (opzionale)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: '#8b9ccc' }}>Annulla</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', '&:hover': { background: 'linear-gradient(135deg,#f6b21a,#e08e09)' }, color: '#000' }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : editing ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
