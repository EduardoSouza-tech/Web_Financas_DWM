'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Verificar se Supabase está configurado
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes('placeholder') && !url.includes('xyzcompany');
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar sessão atual
    const getUser = async () => {
      // Se Supabase não está configurado, usar modo offline
      if (!isSupabaseConfigured()) {
        console.log('Modo offline ativado');
        const offlineUser = localStorage.getItem('offline_user');
        if (offlineUser) {
          setUser(JSON.parse(offlineUser));
        }
        setLoading(false);
        return;
      }

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.warn('Supabase não disponível, usando modo offline');
        const offlineUser = localStorage.getItem('offline_user');
        if (offlineUser) {
          setUser(JSON.parse(offlineUser));
        }
        setLoading(false);
      }
    };

    getUser();

    // Apenas escutar mudanças se Supabase está configurado
    if (isSupabaseConfigured()) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('signIn chamado, modo offline?', !isSupabaseConfigured());
    // Modo offline
    if (!isSupabaseConfigured()) {
      const mockUser = {
        id: 'offline-user',
        email,
        user_metadata: { name: email.split('@')[0] },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      console.log('Criando usuário offline:', mockUser);
      setUser(mockUser);
      localStorage.setItem('offline_user', JSON.stringify(mockUser));
      console.log('Usuário salvo no localStorage');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.warn('Supabase não disponível, usando modo offline');
      const mockUser = {
        id: 'offline-user',
        email,
        user_metadata: { name: email.split('@')[0] },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      setUser(mockUser);
      localStorage.setItem('offline_user', JSON.stringify(mockUser));
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    // Modo offline
    if (!isSupabaseConfigured()) {
      const mockUser = {
        id: 'offline-user',
        email,
        user_metadata: { name },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      setUser(mockUser);
      localStorage.setItem('offline_user', JSON.stringify(mockUser));
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.warn('Supabase não disponível, usando modo offline');
      const mockUser = {
        id: 'offline-user',
        email,
        user_metadata: { name },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;
      setUser(mockUser);
      localStorage.setItem('offline_user', JSON.stringify(mockUser));
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Supabase não disponível');
    }
    localStorage.removeItem('offline_user');
    // Próximo login volta a perguntar "Quem está usando?"
    if (user) sessionStorage.removeItem(`active_profile:${user.id}`);
    setUser(null);
    router.push('/login');
  };

  const getToken = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch (error) {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
