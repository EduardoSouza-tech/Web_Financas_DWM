'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, CreditCard, Wallet, Pause, Play, Trash2, Edit, X, Ban, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useFinance } from '@/contexts/FinanceContext';
import { useConfirm } from '@/providers/confirm-provider';
import { formatCurrency, cn } from '@/lib/utils';
import { formatDateBR, formatMonth } from '@/lib/finance/credit-card';
import {
  nextSubscriptionCharge,
  subscriptionMonthlyCost,
  todayISO,
  type Subscription,
} from '@/lib/finance/engine';

const ICONS = ['📱', '🎬', '🎵', '📦', '💻', '🎨', '🎮', '📚', '☁️', '🏋️', '📰', '🚗'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

type FormState = {
  id?: string;
  name: string;
  category: string;
  amount: string;
  frequency: 'monthly' | 'yearly';
  billingDay: string;
  billingMonth: string;
  paymentMethod: 'cash' | 'credit_card';
  cardId: string;
  icon: string;
};

export default function SubscriptionsPage() {
  const confirm = useConfirm();
  const {
    subscriptions,
    saveSubscription,
    setSubscriptionStatus,
    deleteSubscription,
    categories,
    cards,
    referenceMonth,
    getMonthSummary,
  } = useFinance();

  const emptyForm = (): FormState => ({
    name: '',
    category: categories.find(c => c.type === 'expense')?.name ?? 'Outros',
    amount: '',
    frequency: 'monthly',
    billingDay: String(new Date().getDate()),
    billingMonth: String(new Date().getMonth() + 1),
    paymentMethod: cards.length > 0 ? 'credit_card' : 'cash',
    cardId: cards[0]?.id ?? '',
    icon: '📱',
  });
  const [form, setForm] = useState<FormState | null>(null);

  const active = subscriptions.filter(s => s.status === 'active');
  const monthlyTotal = active.reduce((sum, s) => sum + subscriptionMonthlyCost(s), 0);
  const chargedThisMonth = getMonthSummary(referenceMonth).subscriptionExpenses;
  const today = todayISO();
  const upcoming = active
    .map(s => ({ sub: s, date: nextSubscriptionCharge(s, today) }))
    .filter((x): x is { sub: Subscription; date: string } => !!x.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const cardName = (id?: string) => cards.find(c => c.id === id)?.name ?? 'Cartão removido';

  const openEdit = (s: Subscription) =>
    setForm({
      id: s.id,
      name: s.name,
      category: s.category,
      amount: String(s.amount),
      frequency: s.frequency,
      billingDay: String(s.billingDay),
      billingMonth: String(s.billingMonth ?? 1),
      paymentMethod: s.paymentMethod,
      cardId: s.cardId ?? cards[0]?.id ?? '',
      icon: s.icon,
    });

  const submit = () => {
    if (!form) return;
    const amount = parseFloat(form.amount);
    const day = parseInt(form.billingDay);
    if (!form.name.trim() || !(amount > 0) || !(day >= 1 && day <= 31)) return;
    saveSubscription({
      id: form.id,
      name: form.name.trim(),
      category: form.category,
      amount,
      frequency: form.frequency,
      billingDay: day,
      billingMonth: form.frequency === 'yearly' ? parseInt(form.billingMonth) : undefined,
      paymentMethod: form.paymentMethod,
      cardId: form.paymentMethod === 'credit_card' ? form.cardId : undefined,
      icon: form.icon,
    });
    setForm(null);
  };

  const remove = async (s: Subscription) => {
    const ok = await confirm({
      title: `Excluir "${s.name}"?`,
      message:
        'Apaga também as cobranças passadas dela das análises e faturas.\n\nPara parar de cobrar mantendo o histórico, use o botão "Cancelar" da assinatura.',
      confirmLabel: 'Excluir',
      cancelLabel: 'Voltar',
      destructive: true,
    });
    if (ok) deleteSubscription(s.id);
  };

  const statusBadge = (s: Subscription) =>
    s.status === 'active' ? <Badge variant="success">Ativa</Badge>
    : s.status === 'paused' ? <Badge variant="warning">Pausada</Badge>
    : <Badge variant="secondary">Cancelada</Badge>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assinaturas</h1>
          <p className="text-muted-foreground">Cobranças recorrentes lançadas automaticamente nas despesas</p>
        </div>
        <Button className="gap-2" onClick={() => setForm(emptyForm())}>
          <Plus className="w-4 h-4" />
          Nova Assinatura
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Custo mensal</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
            <p className="text-xs text-muted-foreground">anuais divididas por 12</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Custo anual</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyTotal * 12)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Nas despesas de {formatMonth(referenceMonth, true)}</p>
            <p className="text-2xl font-bold">{formatCurrency(chargedThisMonth)}</p>
            <p className="text-xs text-muted-foreground">cartão conta pela fatura</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ativas</p>
            <p className="text-2xl font-bold">{active.length}</p>
            <p className="text-xs text-muted-foreground">{subscriptions.length - active.length} pausadas/canceladas</p>
          </CardContent>
        </Card>
      </div>

      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Próximas cobranças
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {upcoming.slice(0, 6).map(({ sub, date }) => (
              <div key={sub.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <span className="text-lg">{sub.icon}</span>
                <span className="font-medium">{sub.name}</span>
                <span className="text-muted-foreground">{formatDateBR(date)}</span>
                <span className="font-semibold">{formatCurrency(sub.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            Nenhuma assinatura neste perfil.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map(s => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={cn('h-full', s.status !== 'active' && 'opacity-70')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-3xl">{s.icon}</span>
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{s.name}</CardTitle>
                        <CardDescription>{s.category}</CardDescription>
                      </div>
                    </div>
                    {statusBadge(s)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">
                    {formatCurrency(s.amount)}
                    <span className="text-sm font-normal text-muted-foreground">/{s.frequency === 'monthly' ? 'mês' : 'ano'}</span>
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-2">
                      {s.paymentMethod === 'credit_card' ? <CreditCard className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                      {s.paymentMethod === 'credit_card' ? cardName(s.cardId) : 'À vista'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Dia {s.billingDay}
                      {s.frequency === 'yearly' ? ` de ${MONTHS[(s.billingMonth ?? 1) - 1]}` : ''}
                      {s.status === 'active' && nextSubscriptionCharge(s, today) && ` · próxima ${formatDateBR(nextSubscriptionCharge(s, today)!)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {s.status === 'active' ? (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setSubscriptionStatus(s.id, 'paused')}>
                        <Pause className="w-3 h-3" /> Pausar
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setSubscriptionStatus(s.id, 'active')}>
                        <Play className="w-3 h-3" /> Reativar
                      </Button>
                    )}
                    {s.status !== 'cancelled' && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setSubscriptionStatus(s.id, 'cancelled')}>
                        <Ban className="w-3 h-3" /> Cancelar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(s)} aria-label="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => remove(s)} aria-label="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setForm(null)}>
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-background border rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{form.id ? 'Editar assinatura' : 'Nova assinatura'}</h3>
              <Button variant="ghost" size="sm" onClick={() => setForm(null)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Nome</label>
              <Input placeholder="Ex: Netflix" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
                <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Categoria</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full h-10 px-3 bg-background border rounded-md"
                >
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Frequência</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm({ ...form, frequency: e.target.value as FormState['frequency'] })}
                  className="w-full h-10 px-3 bg-background border rounded-md"
                >
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Dia</label>
                <Input type="number" min="1" max="31" value={form.billingDay} onChange={e => setForm({ ...form, billingDay: e.target.value })} />
              </div>
              {form.frequency === 'yearly' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Mês</label>
                  <select
                    value={form.billingMonth}
                    onChange={e => setForm({ ...form, billingMonth: e.target.value })}
                    className="w-full h-10 px-3 bg-background border rounded-md"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={form.paymentMethod === 'cash' ? 'default' : 'outline'} className="gap-2" onClick={() => setForm({ ...form, paymentMethod: 'cash' })}>
                  <Wallet className="w-4 h-4" /> À vista
                </Button>
                <Button
                  type="button"
                  variant={form.paymentMethod === 'credit_card' ? 'default' : 'outline'}
                  className="gap-2"
                  disabled={cards.length === 0}
                  onClick={() => setForm({ ...form, paymentMethod: 'credit_card', cardId: form.cardId || cards[0]?.id || '' })}
                >
                  <CreditCard className="w-4 h-4" /> Cartão
                </Button>
              </div>
              {form.paymentMethod === 'credit_card' && (
                <select
                  value={form.cardId}
                  onChange={e => setForm({ ...form, cardId: e.target.value })}
                  className="mt-2 w-full h-10 px-3 bg-background border rounded-md"
                >
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Ícone</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className={cn('w-9 h-9 rounded-lg border text-lg', form.icon === icon ? 'border-primary bg-primary/10' : 'border-border')}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {form.id
                ? 'Alterar valor, dia ou forma de pagamento vale também para as cobranças já geradas.'
                : 'A primeira cobrança é gerada a partir de hoje, no dia informado.'}
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setForm(null)}>Cancelar</Button>
              <Button onClick={submit}>Salvar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
