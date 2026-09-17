'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, LogOut, Settings2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { FAMILY_PROFILE_ID, useProfiles } from '@/providers/profile-provider';
import { cn } from '@/lib/utils';
import { ProfileAvatar } from './profile-avatar';

export function ProfileSwitcher() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { profiles, activeProfile, activeProfileId, isFamilyView, hasFamilyView, selectProfile, clearActiveProfile } =
    useProfiles();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (id: string) => {
    selectProfile(id);
    setOpen(false);
  };

  const itemClass = 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent text-left';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-accent transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Trocar perfil"
      >
        <ProfileAvatar profile={isFamilyView ? null : activeProfile} size="md" />
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-popover p-2 shadow-2xl z-50"
          >
            <p className="px-3 pt-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Trocar perfil
            </p>

            {profiles.map(profile => (
              <button key={profile.id} role="menuitem" className={itemClass} onClick={() => choose(profile.id)}>
                <ProfileAvatar profile={profile} size="sm" />
                <span className="flex-1 truncate">{profile.name}</span>
                {activeProfileId === profile.id && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}

            {hasFamilyView && (
              <button role="menuitem" className={itemClass} onClick={() => choose(FAMILY_PROFILE_ID)}>
                <ProfileAvatar size="sm" />
                <span className="flex-1">Família (todos)</span>
                {isFamilyView && <Check className="w-4 h-4 text-primary" />}
              </button>
            )}

            <div className="my-2 border-t border-border" />

            <button
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                clearActiveProfile();
                router.push('/profiles');
              }}
            >
              <Settings2 className="w-4 h-4 mx-2 text-muted-foreground" />
              Gerenciar perfis
            </button>
            <button
              role="menuitem"
              className={cn(itemClass, 'text-red-500')}
              onClick={() => {
                setOpen(false);
                signOut();
              }}
            >
              <LogOut className="w-4 h-4 mx-2" />
              Sair da conta
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
