'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export interface Achievement {
  id: string;
  user_id: string;
  profile_id: string;
  debt_id: string;
  debt_name: string;
  amount: number;
  monthly_payment_freed: number;
  interest_rate: number;
  paid_at: string;
  created_at?: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar conquistas
  const fetchAchievements = async () => {
    if (!user || !isSupabaseConfigured || user.id === 'offline-user') {
      setAchievements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar conquistas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Deletar conquista
  const deleteAchievement = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAchievements(prev => prev.filter(a => a.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao deletar conquista:', err);
      return false;
    }
  };

  // Carregar ao montar
  useEffect(() => {
    fetchAchievements();
  }, [user]);

  return {
    achievements,
    loading,
    error,
    deleteAchievement,
    refresh: fetchAchievements,
  };
}
