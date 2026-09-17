'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Pencil, Plus } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { FAMILY_PROFILE_ID, useProfiles, type Profile } from '@/providers/profile-provider';
import { ProfileAvatar } from '@/components/profiles/profile-avatar';
import { ProfileFormDialog } from '@/components/profiles/profile-form-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_PROFILES = 8;

export default function ProfilesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profiles, loading, error, hasFamilyView, selectProfile, addProfile, updateProfile, deleteProfile } =
    useProfiles();
  const [managing, setManaging] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const enter = (id: string) => {
    selectProfile(id);
    router.push('/dashboard');
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (profile: Profile) => {
    setEditing(profile);
    setDialogOpen(true);
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const tileClass =
    'group flex flex-col items-center gap-3 w-28 sm:w-32 focus:outline-none';
  const avatarRing =
    'ring-0 ring-foreground/80 transition-all group-hover:ring-4 group-focus-visible:ring-4';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl sm:text-5xl font-semibold mb-10 text-center"
      >
        {managing ? 'Gerenciar perfis' : 'Quem está usando?'}
      </motion.h1>

      {error && !dialogOpen && (
        <p className="mb-6 max-w-md text-center text-sm text-red-500">
          Algo deu errado com os perfis: {error}. Se a mensagem citar uma coluna ou tabela que não existe, rode as
          migrações pendentes no Supabase.
        </p>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap justify-center gap-6 sm:gap-8 max-w-4xl"
      >
        {profiles.map(profile => (
          <button
            key={profile.id}
            className={tileClass}
            onClick={() => (managing ? openEdit(profile) : enter(profile.id))}
          >
            <div className="relative">
              <ProfileAvatar profile={profile} size="xl" className={avatarRing} />
              {managing && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                  <Pencil className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <span className="text-muted-foreground group-hover:text-foreground truncate max-w-full">
              {profile.name}
            </span>
          </button>
        ))}

        {hasFamilyView && !managing && (
          <button className={tileClass} onClick={() => enter(FAMILY_PROFILE_ID)}>
            <ProfileAvatar size="xl" className={avatarRing} />
            <span className="text-muted-foreground group-hover:text-foreground">Família</span>
          </button>
        )}

        {profiles.length < MAX_PROFILES && (
          <button className={tileClass} onClick={openNew}>
            <div
              className={cn(
                'w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-dashed border-muted-foreground/40 flex items-center justify-center',
                'text-muted-foreground transition-colors group-hover:border-foreground group-hover:text-foreground'
              )}
            >
              <Plus className="w-12 h-12" />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground">Adicionar perfil</span>
          </button>
        )}
      </motion.div>

      <Button variant="outline" size="lg" className="mt-12" onClick={() => setManaging(m => !m)}>
        {managing ? 'Concluído' : 'Gerenciar perfis'}
      </Button>

      <ProfileFormDialog
        open={dialogOpen}
        profile={editing}
        canDelete={profiles.length > 1}
        onClose={() => setDialogOpen(false)}
        onSave={async input => {
          const saved = editing ? await updateProfile(editing.id, input) : await addProfile(input);
          if (saved) setDialogOpen(false);
        }}
        error={dialogOpen ? error : null}
        onDelete={async () => {
          if (editing && (await deleteProfile(editing.id))) setDialogOpen(false);
        }}
      />
    </div>
  );
}
