import { supabase } from '@/lib/supabase';
import type { Expense, Income, Goal, PaymentMethod, UserSettings } from '@/types';

// ── SETTINGS ─────────────────────────────────────────────────────────────────
export async function getUserSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('userId', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as UserSettings | null;
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>) {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { ...settings, userId, updatedAt: new Date().toISOString() },
      { onConflict: 'userId' }
    );
  if (error) throw error;
}

// ── EXPENSES ─────────────────────────────────────────────────────────────────
export async function addExpense(userId: string, data: Omit<Expense, 'id' | 'userId' | 'createdAt'>) {
  const { data: result, error } = await supabase
    .from('expenses')
    .insert([{ ...data, userId }])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateExpense(id: string, data: Partial<Expense>) {
  const { data: result, error } = await supabase
    .from('expenses')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function getExpenses(userId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('userId', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Expense[];
}

// ── INCOMES ──────────────────────────────────────────────────────────────────
export async function addIncome(userId: string, data: Omit<Income, 'id' | 'userId' | 'createdAt'>) {
  const { data: result, error } = await supabase
    .from('incomes')
    .insert([{ ...data, userId }])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateIncome(id: string, data: Partial<Income>) {
  const { data: result, error } = await supabase
    .from('incomes')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteIncome(id: string) {
  const { error } = await supabase.from('incomes').delete().eq('id', id);
  if (error) throw error;
}

export async function getIncomes(userId: string): Promise<Income[]> {
  const { data, error } = await supabase
    .from('incomes')
    .select('*')
    .eq('userId', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Income[];
}

// ── GOALS ────────────────────────────────────────────────────────────────────
export async function addGoal(userId: string, data: Omit<Goal, 'id' | 'userId' | 'createdAt'>) {
  const { data: result, error } = await supabase
    .from('goals')
    .insert([{ ...data, userId }])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updateGoal(id: string, data: Partial<Goal>) {
  const { data: result, error } = await supabase
    .from('goals')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return data as Goal[];
}

// ── PAYMENT METHODS ──────────────────────────────────────────────────────────
export async function addPaymentMethod(userId: string, data: Omit<PaymentMethod, 'id' | 'userId' | 'createdAt'>) {
  const { data: result, error } = await supabase
    .from('payment_methods')
    .insert([{ ...data, userId }])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function updatePaymentMethod(id: string, data: Partial<PaymentMethod>) {
  const { data: result, error } = await supabase
    .from('payment_methods')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function deletePaymentMethod(id: string) {
  const { error } = await supabase.from('payment_methods').delete().eq('id', id);
  if (error) throw error;
}

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: true });
  if (error) throw error;
  return data as PaymentMethod[];
}
