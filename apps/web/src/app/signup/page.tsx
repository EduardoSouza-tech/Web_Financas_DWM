'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Lock, Mail, MailCheck, User, WifiOff } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { AuthInput, AuthShell, ButtonShine, authButtonClass } from '@/components/auth/auth-shell';

const MIN_PASSWORD = 6;

export default function SignupPage() {
  const router = useRouter();
  const { signUp, offlineMode } = useAuth();
  const reduceMotion = useReducedMotion();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'form' | 'confirm-email' | 'created'>('form');

  const passwordOk = password.length >= MIN_PASSWORD;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!passwordOk) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUp(email.trim(), password, name.trim());
      if (needsEmailConfirmation) {
        // Sem sessão até confirmar o e-mail: não adianta ir para os perfis
        setStatus('confirm-email');
      } else {
        setStatus('created');
        setTimeout(() => router.push('/profiles'), 1500);
      }
    } catch (err: any) {
      setError(err?.message || 'Não foi possível criar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'form') {
    const confirm = status === 'confirm-email';
    return (
      <AuthShell>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-4 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
            {confirm ? <MailCheck className="h-8 w-8 text-white" /> : <CheckCircle2 className="h-8 w-8 text-white" />}
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight">{confirm ? 'Confirme seu e-mail' : 'Conta criada!'}</h2>
          {confirm ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>. Abra o e-mail, clique no
                link e depois entre com sua senha.
              </p>
              <p className="mt-4 text-xs text-muted-foreground">Não chegou? Veja a caixa de spam ou promoções.</p>
              <Link href="/login" className={`${authButtonClass} mt-8`}>
                <ButtonShine />
                Ir para o login <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparando seus perfis...
            </p>
          )}
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Criar conta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Leva menos de um minuto. Depois é só criar os perfis da família.</p>
      </div>

      {offlineMode && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          <WifiOff className="h-4 w-4 shrink-0" />
          Modo demonstração: os dados ficam só neste navegador.
        </div>
      )}

      <form onSubmit={handleSignup} className="mt-8 space-y-5" noValidate>
        <AuthInput
          id="name"
          label="Nome"
          icon={User}
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Como quer ser chamado"
        />

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
          autoComplete="new-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
          hint={
            password.length > 0 && (
              <p className={`flex items-center gap-1.5 text-xs ${passwordOk ? 'text-green-500' : 'text-muted-foreground'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {passwordOk ? 'Tamanho mínimo atingido' : `Faltam ${MIN_PASSWORD - password.length} caracteres`}
              </p>
            )
          }
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

        <button type="submit" disabled={loading || !name.trim() || !email || !password} className={authButtonClass}>
          <ButtonShine />
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Criando conta...
            </>
          ) : (
            <>
              Criar conta <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold text-blue-500 transition hover:text-cyan-400">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
