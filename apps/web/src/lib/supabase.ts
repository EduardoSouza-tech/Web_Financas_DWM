import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar se está configurado
const isConfigured = !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('xyzcompany') && !supabaseUrl.includes('placeholder');

export const isSupabaseConfigured = isConfigured;

if (!isConfigured) {
  console.warn('⚠️ Supabase não configurado. Usando modo offline.');
}

// Criar client com configuração customizada para lidar com erros de rede
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: isConfigured,
      detectSessionInUrl: isConfigured,
    },
    global: {
      fetch: async (url, options = {}) => {
        try {
          return await fetch(url, options);
        } catch (error) {
          // Suprimir erros de rede quando Supabase não está disponível
          console.debug('Supabase offline:', error instanceof Error ? error.message : 'Network error');
          throw error;
        }
      },
    },
  }
);

// Tipos do banco de dados
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          avatar_color: string;
          avatar_emoji: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          avatar_color?: string;
          avatar_emoji?: string | null;
          position?: number;
        };
        Update: {
          name?: string;
          avatar_color?: string;
          avatar_emoji?: string | null;
          position?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          profile_id: string;
          type: 'income' | 'expense';
          amount: number;
          category: string;
          description: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'income' | 'expense';
          amount: number;
          category: string;
          description: string;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'income' | 'expense';
          amount?: number;
          category?: string;
          description?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      debts: {
        Row: {
          id: string;
          user_id: string;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
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
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          total_amount?: number;
          remaining_amount?: number;
          monthly_payment?: number;
          interest_rate?: number;
          installments_paid?: number;
          total_installments?: number;
          next_due_date?: string;
          creditor?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          debt_id: string;
          debt_name: string;
          amount: number;
          monthly_payment_freed: number;
          interest_rate: number;
          paid_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          debt_id: string;
          debt_name: string;
          amount: number;
          monthly_payment_freed: number;
          interest_rate: number;
          paid_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          debt_id?: string;
          debt_name?: string;
          amount?: number;
          monthly_payment_freed?: number;
          interest_rate?: number;
          paid_at?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          budget_limit: number | null;
          type: 'income' | 'expense';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon: string;
          budget_limit?: number | null;
          type: 'income' | 'expense';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string;
          budget_limit?: number | null;
          type?: 'income' | 'expense';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
