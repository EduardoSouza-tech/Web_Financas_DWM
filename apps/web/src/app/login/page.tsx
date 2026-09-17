'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, WifiOff } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { AuthInput, AuthShell, ButtonShine, authButtonClass } from '@/components/auth/auth-shell';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, offlineMode } = useAuth();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      router.push('/profiles');
    } catch (err: any) {
      setError(err?.message || 'Não foi possível entrar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Entrar</h2>
        <p className="mt-1 text-sm text-muted-foreground">Bom te ver de novo. Acesse sua conta para continuar.</p>
      </div>

      {offlineMode && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          <WifiOff className="h-4 w-4 shrink-0" />
          Modo demonstração: os dados ficam só neste navegador.
        </div>
      )}

      <form onSubmit={handleLogin} className="mt-8 space-y-5" noValidate>
        <AuthInput
          id="email"
          label="E-mail"
          icon={Mail}
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="voce@email.com"
        />

        <AuthInput
          id="password"
          label="Senha"
          icon={Lock}
          password
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Sua senha"
        />

        <div aria-live="polite">
          {error && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </div>

        <button type="submit" disabled={loading || !email || !password} className={authButtonClass}>
          <ButtonShine />
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
            </>
          ) : (
            <>
              Entrar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link href="/signup" className="font-semibold text-blue-500 transition hover:text-cyan-400">
          Criar conta
        </Link>
      </p>
    </AuthShell>
  );
}
