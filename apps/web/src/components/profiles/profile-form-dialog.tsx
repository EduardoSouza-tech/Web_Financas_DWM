'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ImageOff, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PROFILE_COLORS, type Profile, type ProfileInput } from '@/providers/profile-provider';
import { ProfileAvatar } from './profile-avatar';
import { ImageError, prepareAvatar } from '@/lib/image-resize';

const EMOJIS = ['😀', '😎', '🧑', '👩', '👨', '👧', '👦', '👵', '👴', '🐶', '🐱', '🦊', '🚀', '⭐'];

interface ProfileFormDialogProps {
  open: boolean;
  /** Perfil existente para editar; ausente = criar novo */
  profile?: Profile | null;
  canDelete?: boolean;
  onClose: () => void;
  onSave: (input: ProfileInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Erro vindo do salvamento (ex.: banco) */
  error?: string | null;
}

export function ProfileFormDialog({ open, profile, canDelete, onClose, onSave, onDelete, error }: ProfileFormDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PROFILE_COLORS[0]);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(profile?.name ?? '');
    setColor(profile?.avatar_color ?? PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)]);
    setEmoji(profile?.avatar_emoji ?? null);
    setImage(profile?.avatar_image ?? null);
    setImageError(null);
    setConfirmDelete(false);
  }, [open, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), avatar_color: color, avatar_emoji: emoji, avatar_image: image });
    setSaving(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    setImageError(null);
    setProcessingImage(true);
    try {
      setImage(await prepareAvatar(file));
    } catch (err) {
      setImageError(err instanceof ImageError ? err.message : 'Não foi possível usar esta imagem.');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setSaving(true);
    await onDelete();
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={onClose}
        >
          <motion.form
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">{profile ? 'Editar perfil' : 'Novo perfil'}</h2>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="group relative rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                aria-label={image ? 'Trocar foto' : 'Enviar foto'}
              >
                <ProfileAvatar profile={{ name: name || '?', avatar_color: color, avatar_emoji: emoji, avatar_image: image }} size="xl" />
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-black/55 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {processingImage ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                  {image ? 'Trocar foto' : 'Enviar foto'}
                </span>
                {processingImage && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/55">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </span>
                )}
              </button>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleFile} />

              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileInput.current?.click()} disabled={processingImage}>
                  <Camera className="h-4 w-4" />
                  {image ? 'Trocar foto' : 'Enviar foto'}
                </Button>
                {image && (
                  <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-red-500 hover:text-red-600" onClick={() => setImage(null)}>
                    <ImageOff className="h-4 w-4" />
                    Remover foto
                  </Button>
                )}
              </div>
              {imageError && <p className="mt-2 text-center text-sm text-red-500">{imageError}</p>}
            </div>

            <label className="block text-sm font-medium mb-2" htmlFor="profile-name">
              Nome
            </label>
            <input
              id="profile-name"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              placeholder="Ex.: Maria"
              className="w-full h-11 rounded-xl border border-input bg-background px-4 mb-5 focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <p className="text-sm font-medium mb-2">
              Cor{image && <span className="font-normal text-muted-foreground"> (usada quando não há foto)</span>}
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {PROFILE_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>

            <p className="text-sm font-medium mb-2">Ícone</p>
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() => setEmoji(null)}
                className={cn(
                  'h-9 px-3 rounded-lg border text-sm',
                  emoji === null ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                )}
              >
                Inicial
              </button>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'w-9 h-9 rounded-lg border text-lg',
                    emoji === e ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>

            {error && !confirmDelete && (
              <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                Não foi possível salvar: {error}
              </p>
            )}

            {confirmDelete ? (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 mb-4 text-sm">
                <p className="mb-3">
                  Excluir <strong>{profile?.name}</strong>? Todas as transações e dívidas deste perfil também serão
                  apagadas. Isso não pode ser desfeito.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="destructive" size="sm" disabled={saving} onClick={handleDelete}>
                    Excluir perfil
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              {profile && canDelete && !confirmDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || processingImage || !name.trim()}>
                Salvar
              </Button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
