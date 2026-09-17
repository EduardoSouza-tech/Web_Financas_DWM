'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export interface Debt {
  id: string;
  user_id: string;
  profile_id: string;
  name: string;
  type: string;
  total_amount: number;
  remaining_amount: number;
  monthly_payment: number;
  interest_rate: number;
  installments_paid: number;
  total_installments: number;
  next_due_date: string;
  creditor: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export function useDebts() {
  const { user } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dívidas
  const fetchDebts = async () => {
    if (!user || !isSupabaseConfigured || user.id === 'offline-user') {
      setDebts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      setDebts(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar dívidas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar dívida
  const addDebt = async (debt: Omit<Debt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('debts')
        .insert([{ ...debt, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setDebts(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao adicionar dívida:', err);
      return null;
    }
  };

  // Atualizar dívida
  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setDebts(prev =>
        prev.map(d => (d.id === id ? data : d))
      );
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao atualizar dívida:', err);
      return null;
    }
  };

  // Deletar dívida
  const deleteDebt = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setDebts(prev => prev.filter(d => d.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar dívida:', err);
      return false;
    }
  };

  // Quitar dívida (criar achievement)
  const payOffDebt = async (debt: Debt) => {
    if (!user) return false;

    try {
      // Criar achievement
      const { error: achievementError } = await supabase
        .from('achievements')
        .insert([{
          user_id: user.id,
          profile_id: debt.profile_id,
          debt_id: debt.id,
          debt_name: debt.name,
          amount: debt.total_amount,
          monthly_payment_freed: debt.monthly_payment,
          interest_rate: debt.interest_rate,
          paid_at: new Date().toISOString(),
        }]);

      if (achievementError) throw achievementError;

      // Deletar dívida
      await deleteDebt(debt.id);
      
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao quitar dívida:', err);
      return false;
    }
  };

  // Carregar ao montar
  useEffect(() => {
    fetchDebts();
  }, [user]);

  return {
    debts,
    loading,
    error,
    addDebt,
    updateDebt,
    deleteDebt,
    payOffDebt,
    refresh: fetchDebts,
  };
}
