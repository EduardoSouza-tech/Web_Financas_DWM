'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export const FAMILY_PROFILE_ID = 'family';

export const PROFILE_COLORS = [
  '#3b82f6', // azul
  '#8b5cf6', // roxo
  '#10b981', // verde
  '#f59e0b', // laranja
  '#ef4444', // vermelho
  '#ec4899', // rosa
  '#14b8a6', // turquesa
  '#64748b', // cinza
];

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_color: string;
  avatar_emoji: string | null;
  position: number;
  /** Renda mensal esperada do perfil (usada nas previsões) */
  expected_income?: number | null;
}

export type ProfileInput = Pick<Profile, 'name' | 'avatar_color' | 'avatar_emoji'> & { expected_income?: number | null };

interface ProfileContextType {
  profiles: Profile[];
  loading: boolean;
  error: string | null;
  /** ID do perfil ativo, FAMILY_PROFILE_ID para a visão família, ou null se nenhum foi escolhido */
  activeProfileId: string | null;
  activeProfile: Profile | null;
  isFamilyView: boolean;
  /** A visão família só faz sentido com mais de um perfil */
  hasFamilyView: boolean;
  selectProfile: (id: string) => void;
  clearActiveProfile: () => void;
  addProfile: (input: ProfileInput) => Promise<Profile | null>;
  updateProfile: (id: string, input: Partial<ProfileInput>) => Promise<Profile | null>;
  deleteProfile: (id: string) => Promise<boolean>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Perfil escolhido fica na sessionStorage: ao abrir o navegador de novo,
// a tela "Quem está usando?" aparece outra vez (como Netflix/Prime Video).
const activeKey = (userId: string) => `active_profile:${userId}`;
const offlineKey = (userId: string) => `offline_profiles:${userId}`;

function readStorage(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, key: string, value: string | null) {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    // storage indisponível (modo privado etc.) - segue só em memória
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  // Para qual usuário os perfis já foram carregados; evita um render com usuário novo e perfis antigos
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // Supabase só é usado quando configurado e o usuário é real (não o fallback offline)
  const useRemote = isSupabaseConfigured && !!user && user.id !== 'offline-user';

  const saveOffline = useCallback(
    (list: Profile[]) => {
      if (user) writeStorage(localStorage, offlineKey(user.id), JSON.stringify(list));
    },
    [user]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfiles([]);
      setActiveProfileId(null);
      setLoadedFor(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setError(null);
      let list: Profile[] = [];

      if (useRemote) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true });
        if (error) {
          console.error('Erro ao carregar perfis:', error);
          if (!cancelled) setError(error.message);
        }
        list = (data as Profile[]) || [];
      } else {
        const saved = readStorage(localStorage, offlineKey(user.id));
        list = saved ? JSON.parse(saved) : [];
        if (list.length === 0) {
          list = [
            {
              id: `offline-${Date.now()}`,
              user_id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'Eu',
              avatar_color: PROFILE_COLORS[0],
              avatar_emoji: null,
              position: 0,
            },
          ];
          writeStorage(localStorage, offlineKey(user.id), JSON.stringify(list));
        }
      }

      if (cancelled) return;
      setProfiles(list);

      const saved = readStorage(sessionStorage, activeKey(user.id));
      const stillValid =
        saved && (saved === FAMILY_PROFILE_ID ? list.length > 1 : list.some(p => p.id === saved));
      setActiveProfileId(stillValid ? saved : null);
      setLoadedFor(user.id);
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading, useRemote]);

  const selectProfile = useCallback(
    (id: string) => {
      setActiveProfileId(id);
      if (user) writeStorage(sessionStorage, activeKey(user.id), id);
    },
    [user]
  );

  const clearActiveProfile = useCallback(() => {
    setActiveProfileId(null);
    if (user) writeStorage(sessionStorage, activeKey(user.id), null);
  }, [user]);

  const addProfile = async (input: ProfileInput): Promise<Profile | null> => {
    if (!user) return null;
    const position = profiles.length ? Math.max(...profiles.map(p => p.position)) + 1 : 0;

    if (useRemote) {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ ...input, user_id: user.id, position }])
        .select()
        .single();
      if (error) {
        setError(error.message);
        return null;
      }
      setProfiles(prev => [...prev, data as Profile]);
      return data as Profile;
    }

    const profile: Profile = { ...input, id: `offline-${Date.now()}`, user_id: user.id, position };
    const list = [...profiles, profile];
    setProfiles(list);
    saveOffline(list);
    return profile;
  };

  const updateProfile = async (id: string, input: Partial<ProfileInput>): Promise<Profile | null> => {
    if (!user) return null;

    if (useRemote) {
      const { data, error } = await supabase
        .from('profiles')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) {
        setError(error.message);
        return null;
      }
      setProfiles(prev => prev.map(p => (p.id === id ? (data as Profile) : p)));
      return data as Profile;
    }

    const list = profiles.map(p => (p.id === id ? { ...p, ...input } : p));
    setProfiles(list);
    saveOffline(list);
    return list.find(p => p.id === id) || null;
  };

  const deleteProfile = async (id: string): Promise<boolean> => {
    if (!user || profiles.length <= 1) return false;

    if (useRemote) {
      // ON DELETE CASCADE remove também as transações/dívidas deste perfil
      const { error } = await supabase.from('profiles').delete().eq('id', id).eq('user_id', user.id);
      if (error) {
        setError(error.message);
        return false;
      }
    }

    const list = profiles.filter(p => p.id !== id);
    setProfiles(list);
    if (!useRemote) saveOffline(list);
    if (activeProfileId === id || (activeProfileId === FAMILY_PROFILE_ID && list.length <= 1)) {
      clearActiveProfile();
    }
    return true;
  };

  const loading = authLoading || loadedFor !== (user ? user.id : null);

  const value = useMemo<ProfileContextType>(
    () => ({
      profiles,
      loading,
      error,
      activeProfileId,
      activeProfile: profiles.find(p => p.id === activeProfileId) || null,
      isFamilyView: activeProfileId === FAMILY_PROFILE_ID,
      hasFamilyView: profiles.length > 1,
      selectProfile,
      clearActiveProfile,
      addProfile,
      updateProfile,
      deleteProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profiles, loading, error, activeProfileId, selectProfile, clearActiveProfile, useRemote]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfiles() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfiles must be used within a ProfileProvider');
  }
  return context;
}
