import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/providers/profile-provider';

const sizes = {
  sm: 'w-8 h-8 text-sm rounded-lg',
  md: 'w-10 h-10 text-base rounded-xl',
  xl: 'w-28 h-28 sm:w-32 sm:h-32 text-5xl rounded-2xl',
};

interface ProfileAvatarProps {
  /** Sem perfil = avatar da visão Família */
  profile?: Pick<Profile, 'name' | 'avatar_color' | 'avatar_emoji'> | null;
  size?: keyof typeof sizes;
  className?: string;
}

export function ProfileAvatar({ profile, size = 'md', className }: ProfileAvatarProps) {
  if (!profile) {
    return (
      <div
        className={cn(
          'flex items-center justify-center shrink-0 bg-gradient-to-br from-primary to-cyan-600 text-white',
          sizes[size],
          className
        )}
      >
        <Users className={size === 'xl' ? 'w-14 h-14' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} />
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-center justify-center shrink-0 font-bold text-white select-none', sizes[size], className)}
      style={{ backgroundColor: profile.avatar_color }}
    >
      {profile.avatar_emoji || profile.name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}
