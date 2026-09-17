'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export interface Transaction {
  id: string;
  user_id: string;
  profile_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar transações
  const fetchTransactions = async () => {
    if (!user || !isSupabaseConfigured || user.id === 'offline-user') {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar transações:', err);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar transação
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setTransactions(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao adicionar transação:', err);
      return null;
    }
  };

  // Atualizar transação
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setTransactions(prev =>
        prev.map(t => (t.id === id ? data : t))
      );
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao atualizar transação:', err);
      return null;
    }
  };

  // Deletar transação
  const deleteTransaction = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar transação:', err);
      return false;
    }
  };

  // Carregar ao montar
  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: fetchTransactions,
  };
}
