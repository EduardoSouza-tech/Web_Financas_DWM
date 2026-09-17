'use client';

import { forwardRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Eye, EyeOff, PiggyBank, ShieldCheck, Users, type LucideIcon } from 'lucide-react';

// Barras decorativas do cartão de exemplo (altura em %)
const PREVIEW_BARS = [34, 48, 40, 62, 55, 72, 58, 88];

export function useFadeUp() {
  const reduceMotion = useReducedMotion();
  return (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: 'easeOut' as const },
        };
}

/** Layout das telas de acesso (login e cadastro): fundo, painel da marca e cartão do formulário */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const fadeUp = useFadeUp();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Fundo: grade discreta + brilhos azuis */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-blue-500/25 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 right-0 h-[480px] w-[480px] rounded-full bg-cyan-500/15 blur-[120px]" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* ============ Marca (desktop) ============ */}
        <section className="hidden lg:block">
          <motion.div {...fadeUp(0)} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">Finanças</p>
              <p className="text-xs text-muted-foreground">Gestão financeira da família</p>
            </div>
          </motion.div>

          <motion.h1 {...fadeUp(0.08)} className="mt-10 text-5xl font-bold leading-[1.05] tracking-tight">
            Cada real no lugar,
            <br />
            <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 bg-clip-text text-transparent">
              para toda a família.
            </span>
          </motion.h1>

          <motion.p {...fadeUp(0.16)} className="mt-5 max-w-md text-lg text-muted-foreground">
            Receitas, cartões, dívidas e metas de cada perfil num só lugar, com a saúde financeira calculada em tempo real.
          </motion.p>

          {/* Cartão de exemplo flutuante */}
          <motion.div {...fadeUp(0.26)} className="relative mt-12 max-w-md">
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-2xl border border-border bg-card/60 p-6 shadow-2xl shadow-blue-500/10 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Livre para gastar no mês</p>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  exemplo
                </span>
              </div>
              <p className="mt-1 text-3xl font-bold tracking-tight">R$ 2.323,30</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-green-500">
                <CheckCircle2 className="h-3.5 w-3.5" /> dentro do orçamento
              </p>

              <div className="mt-6 flex h-28 items-end gap-2.5" aria-hidden>
                {PREVIEW_BARS.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={reduceMotion ? false : { height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.7, delay: 0.5 + i * 0.07, ease: 'easeOut' }}
                    className={`flex-1 rounded-t-md rounded-b-sm ${
                      i === PREVIEW_BARS.length - 1 ? 'bg-gradient-to-t from-blue-500 to-cyan-400' : 'bg-blue-500/20'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Fundo de emergência</span>
                  <span className="font-medium">62%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={reduceMotion ? false : { width: 0 }}
                    animate={{ width: '62%' }}
                    transition={{ duration: 1, delay: 0.9, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  />
                </div>
              </div>
            </motion.div>

            {/* Selo flutuante */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.4 }}
              className="absolute -bottom-5 -right-6 flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-xs shadow-xl backdrop-blur-xl"
            >
              <Users className="h-4 w-4 text-blue-500" />
              <span>Perfis para cada pessoa da casa</span>
            </motion.div>
          </motion.div>
        </section>

        {/* ============ Formulário ============ */}
        <section className="mx-auto w-full max-w-md">
          {/* Marca (celular) */}
          <motion.div {...fadeUp(0)} className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
              <PiggyBank className="h-7 w-7 text-white" />
            </div>
            <p className="mt-3 text-lg font-bold">Finanças</p>
          </motion.div>

          <motion.div
            {...fadeUp(0.1)}
            className="rounded-3xl border border-border bg-card/70 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10"
          >
            {children}
          </motion.div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Cada conta só acessa os próprios dados
          </p>
        </section>
      </div>
    </main>
  );
}

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: LucideIcon;
  hint?: React.ReactNode;
  /** Campo de senha com botão de mostrar/ocultar */
  password?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { id, label, icon: Icon, hint, password, type, className, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
        <input
          ref={ref}
          id={id}
          type={password ? (visible ? 'text' : 'password') : type}
          className={`h-12 w-full rounded-xl border border-input bg-background/60 pl-10 ${
            password ? 'pr-12' : 'pr-4'
          } text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 ${className ?? ''}`}
          {...props}
        />
        {password && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint}
    </div>
  );
});

export const authButtonClass =
  'group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-blue-500/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60';

/** Brilho que atravessa o botão no hover */
export function ButtonShine() {
  return (
    <span
      aria-hidden
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
    />
  );
}
