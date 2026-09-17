'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface SignUpResult {
  /** true quando o Supabase exige confirmar o e-mail antes do primeiro login */
  needsEmailConfirmation: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** true quando o Supabase não está configurado e o sistema roda só no navegador */
  offlineMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// O Supabase reenvia a sessão (ex.: ao voltar para a aba) com um objeto novo do mesmo usuário.
// Manter o mesmo objeto evita que perfis e dados sejam recarregados à toa.
const sameUser = (prev: User | null, next: User | null) =>
  !!prev && !!next && prev.id === next.id && prev.updated_at === next.updated_at;

const OFFLINE_USER_KEY = 'offline_user';

function createOfflineUser(email: string, name: string): User {
  return {
    id: 'offline-user',
    email,
    user_metadata: { name },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;
}

/** Traduz os erros do Supabase Auth; falha de rede vira mensagem de conexão (nunca login offline) */
function authErrorMessage(error: unknown): string {
  const err = error as { message?: string; status?: number; name?: string; code?: string };
  const message = (err?.message ?? '').toLowerCase();

  if (err?.name === 'AuthRetryableFetchError' || message.includes('failed to fetch') || message.includes('network')) {
    return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
  }
  if (err?.code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (err?.code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  }
  if (err?.code === 'user_already_exists' || message.includes('already registered')) {
    return 'Já existe uma conta com este e-mail.';
  }
  if (message.includes('password should be') || err?.code === 'weak_password') {
    return 'Senha fraca: use pelo menos 6 caracteres.';
  }
  if (err?.status === 429 || message.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  return err?.message || 'Não foi possível concluir. Tente novamente.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Modo offline: só quando o Supabase não está configurado
    if (!isSupabaseConfigured) {
      try {
        const saved = localStorage.getItem(OFFLINE_USER_KEY);
        if (saved) setUser(JSON.parse(saved));
      } catch {
        // storage indisponível
      }
      setLoading(false);
      return;
    }

    // Um usuário offline antigo não pode valer quando o Supabase está ativo
    try {
      localStorage.removeItem(OFFLINE_USER_KEY);
    } catch {
      // storage indisponível
    }

    supabase.auth
      .getUser()
      .then(({ data }) => setUser(prev => (sameUser(prev, data.user) ? prev : data.user ?? null)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      setUser(prev => (sameUser(prev, next) ? prev : next));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const offlineUser = createOfflineUser(email, email.split('@')[0]);
      setUser(offlineUser);
      localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(offlineUser));
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password }).catch(err => ({
      data: { user: null },
      error: err,
    }));
    if (error) throw new Error(authErrorMessage(error));
    setUser(data.user);
  };

  const signUp = async (email: string, password: string, name: string): Promise<SignUpResult> => {
    if (!isSupabaseConfigured) {
      const offlineUser = createOfflineUser(email, name);
      setUser(offlineUser);
      localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(offlineUser));
      return { needsEmailConfirmation: false };
    }

    const { data, error } = await supabase.auth
      .signUp({ email, password, options: { data: { name } } })
      .catch(err => ({ data: { user: null, session: null }, error: err }));
    if (error) throw new Error(authErrorMessage(error));

    // Com "confirmar e-mail" ligado no Supabase, não vem sessão até clicar no link
    if (!data.session) return { needsEmailConfirmation: true };
    setUser(data.user);
    return { needsEmailConfirmation: false };
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // sem conexão: a sessão local é limpa abaixo mesmo assim
      }
    }
    try {
      localStorage.removeItem(OFFLINE_USER_KEY);
      // Próximo login volta a perguntar "Quem está usando?"
      if (user) sessionStorage.removeItem(`active_profile:${user.id}`);
    } catch {
      // storage indisponível
    }
    setUser(null);
    router.push('/login');
  };

  const getToken = async () => {
    if (!isSupabaseConfigured) return null;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, offlineMode: !isSupabaseConfigured, signIn, signUp, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
