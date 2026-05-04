'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getExpenses, getIncomes, getGoals, getPaymentMethods } from '@/lib/database';
import type { Expense, Income, Goal, PaymentMethod } from '@/types';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { RiArrowUpLine, RiArrowDownLine, RiFlag2Line, RiWalletLine } from 'react-icons/ri';
import { CircularProgress, LinearProgress } from '@mui/material';
import dayjs from 'dayjs';

const COLORS = ['#4f8ef7', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#f472b6'];

function fmt(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
}

function StatCard({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-5 flex items-center gap-4 hover:border-[#3a4060] transition-colors">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[#8b9ccc] text-xs font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-[#8b9ccc] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const [e, i, g, p] = await Promise.all([
      getExpenses(user.id),
      getIncomes(user.id),
      getGoals(user.id),
      getPaymentMethods(user.id),
    ]);
    setExpenses(e);
    setIncomes(i);
    setGoals(g);
    setPaymentMethods(p);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const balance = totalIncome - totalExpenses;
  
  // Real Balance from Cards
  const realBalance = paymentMethods.reduce((s, m) => s + m.balance, 0);

  const totalGoalsTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalGoalsCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);

  // This month data
  const thisMonthKey = dayjs().format('YYYY-MM');
  const thisMonthExpenses = expenses.filter(e => e.date?.startsWith(thisMonthKey)).reduce((s, e) => s + e.amount, 0);
  const thisMonthIncome = incomes.filter(i => i.date?.startsWith(thisMonthKey)).reduce((s, i) => s + i.amount, 0);
  const savingsRate = thisMonthIncome > 0 ? Math.round(((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100) : 0;

  // Upcoming recurrences (next 7 days)
  const next7Days = Array.from({ length: 7 }, (_, idx) => dayjs().add(idx, 'day').format('DD'));
  const upcomingExpenses = expenses.filter(e => e.type === 'recurring' && next7Days.includes(dayjs(e.date).format('DD')));
  const upcomingIncomes = incomes.filter(i => i.type === 'recurring' && next7Days.includes(dayjs(i.date).format('DD')));
  const allUpcoming = [...upcomingExpenses.map(x => ({ ...x, kind: 'expense' })), ...upcomingIncomes.map(x => ({ ...x, kind: 'income' }))]
    .sort((a, b) => dayjs(a.date).date() - dayjs(b.date).date());

  // Monthly chart data (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = dayjs().subtract(5 - i, 'month');
    return { key: d.format('YYYY-MM'), label: d.format('MMM') };
  });

  const monthlyData = months.map(({ key, label }) => ({
    month: label,
    Spese: expenses.filter(e => e.date?.startsWith(key)).reduce((s, e) => s + e.amount, 0),
    Guadagni: incomes.filter(i => i.date?.startsWith(key)).reduce((s, i) => s + i.amount, 0),
  }));

  // Expense by category pie
  const expCats: Record<string, number> = {};
  expenses.forEach(e => { expCats[e.category] = (expCats[e.category] ?? 0) + e.amount; });
  const pieData = Object.entries(expCats).map(([name, value]) => ({ name, value }));

  // Priority sort for goals
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedGoals = [...goals].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const priorityColor = { high: '#f87171', medium: '#fbbf24', low: '#34d399' };
  const priorityLabel = { high: 'Alta', medium: 'Media', low: 'Bassa' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CircularProgress sx={{ color: '#4f8ef7' }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-[#8b9ccc] text-sm mt-1">Bentornato, ecco la tua situazione finanziaria</p>
        </div>

        {/* Mini Cards Horizontal Scroll */}
        {paymentMethods.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {paymentMethods.map(m => (
              <div key={m.id} className="min-w-[200px] bg-gradient-to-br from-[#1e2235] to-[#181c27] border border-[#2a3050] rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-bold text-[#8b9ccc] tracking-wider">{m.type}</span>
                    <span className="text-lg">{m.type === 'cash' ? '💵' : '💳'}</span>
                  </div>
                  <p className="text-white font-semibold text-sm truncate">{m.name}</p>
                </div>
                <p className="text-lg font-bold text-white mt-3">{fmt(m.balance)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Patrimonio Totale"
            value={fmt(realBalance)}
            icon={<RiWalletLine size={22} className="text-white" />}
            color="bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20"
            sub="Somma di tutti i conti"
          />
          <StatCard
            label="Entrate del Mese"
            value={fmt(thisMonthIncome)}
            icon={<RiArrowUpLine size={22} className="text-emerald-400" />}
            color="bg-emerald-500/10"
            sub="Questo mese"
          />
          <StatCard
            label="Spese del Mese"
            value={fmt(thisMonthExpenses)}
            icon={<RiArrowDownLine size={22} className="text-red-400" />}
            color="bg-red-500/10"
            sub="Questo mese"
          />
          <StatCard
            label="Risparmio"
            value={`${savingsRate}%`}
            icon={<RiFlag2Line size={22} className="text-yellow-400" />}
            color="bg-yellow-500/10"
            sub={savingsRate > 0 ? "Ottimo lavoro!" : "Controlla le spese"}
          />
        </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area chart */}
        <div className="xl:col-span-2 bg-[#181c27] border border-[#2a3050] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-1">Andamento ultimi 6 mesi</h3>
          <p className="text-[#8b9ccc] text-xs mb-4">Confronto tra spese e guadagni mensili</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorGuadagni" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSpese" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3050" />
              <XAxis dataKey="month" tick={{ fill: '#8b9ccc', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b9ccc', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
              <Tooltip
                contentStyle={{ background: '#1e2235', border: '1px solid #2a3050', borderRadius: 8 }}
                labelStyle={{ color: '#f0f4ff' }}
                formatter={(v: any) => fmt(Number(v))}
              />
              <Legend wrapperStyle={{ color: '#8b9ccc', fontSize: 12 }} />
              <Area type="monotone" dataKey="Guadagni" stroke="#34d399" fill="url(#colorGuadagni)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Spese" stroke="#f87171" fill="url(#colorSpese)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-1">Spese per categoria</h3>
          <p className="text-[#8b9ccc] text-xs mb-4">Distribuzione delle uscite</p>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[#8b9ccc] text-sm">Nessuna spesa</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e2235', border: '1px solid #2a3050', borderRadius: 8 }}
                  formatter={(v: any) => fmt(Number(v))}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-1 mt-2">
            {pieData.slice(0, 4).map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-[#8b9ccc] capitalize flex-1">{d.name}</span>
                <span className="text-white font-medium">{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming events & Goals */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming events */}
        <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-1">Prossime Scadenze</h3>
          <p className="text-[#8b9ccc] text-xs mb-5">Cosa accadrà nei prossimi 7 giorni</p>
          <div className="space-y-3">
            {allUpcoming.length === 0 ? (
              <p className="text-[#8b9ccc] text-sm text-center py-4">Nessun evento ricorrente imminente</p>
            ) : (
              allUpcoming.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-[#1e2235] rounded-xl border border-[#2a3050]">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.kind === 'expense' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {item.kind === 'expense' ? <RiArrowDownLine size={16} /> : <RiArrowUpLine size={16} />}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      <p className="text-[#8b9ccc] text-[10px]">Giorno {dayjs(item.date).format('DD')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${item.kind === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {item.kind === 'expense' ? '-' : '+'}{fmt(item.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Goals progress */}
        <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-1">Progresso Obiettivi</h3>
          <p className="text-[#8b9ccc] text-xs mb-5">Quanto manca al raggiungimento dei tuoi traguardi</p>
          <div className="space-y-5">
            {goals.length === 0 ? (
               <p className="text-[#8b9ccc] text-sm text-center py-4">Nessun obiettivo impostato</p>
            ) : sortedGoals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const remaining = goal.targetAmount - goal.currentAmount;
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: priorityColor[goal.priority] + '22', color: priorityColor[goal.priority] }}
                      >
                        {priorityLabel[goal.priority]}
                      </span>
                      <span className="text-white text-sm font-medium">{goal.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white text-sm font-bold">{pct}%</span>
                      {remaining > 0 && (
                        <span className="text-[#8b9ccc] text-xs ml-2">mancano {fmt(remaining)}</span>
                      )}
                    </div>
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#2a3050',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: pct >= 100
                          ? 'linear-gradient(90deg, #34d399, #10b981)'
                          : `linear-gradient(90deg, ${priorityColor[goal.priority]}, ${priorityColor[goal.priority]}aa)`,
                      },
                    }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[#8b9ccc] text-xs">{fmt(goal.currentAmount)}</span>
                    <span className="text-[#8b9ccc] text-xs">{fmt(goal.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent expenses */}
        <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Ultime Spese</h3>
          {expenses.length === 0 ? (
            <p className="text-[#8b9ccc] text-sm text-center py-6">Nessuna spesa registrata</p>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-[#2a3050] last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{e.name}</p>
                    <p className="text-[#8b9ccc] text-xs capitalize">{e.category} · {e.type === 'recurring' ? 'Ricorrente' : 'Sporadica'}</p>
                  </div>
                  <span className="text-red-400 font-semibold text-sm">−{fmt(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent incomes */}
        <div className="bg-[#181c27] border border-[#2a3050] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4">Ultimi Guadagni</h3>
          {incomes.length === 0 ? (
            <p className="text-[#8b9ccc] text-sm text-center py-6">Nessun guadagno registrato</p>
          ) : (
            <div className="space-y-3">
              {incomes.slice(0, 5).map(i => (
                <div key={i.id} className="flex items-center justify-between py-2 border-b border-[#2a3050] last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{i.name}</p>
                    <p className="text-[#8b9ccc] text-xs capitalize">{i.category} · {i.type === 'recurring' ? 'Ricorrente' : 'Sporadico'}</p>
                  </div>
                  <span className="text-emerald-400 font-semibold text-sm">+{fmt(i.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
