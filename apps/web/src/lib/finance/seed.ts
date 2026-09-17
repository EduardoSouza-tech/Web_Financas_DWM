/**
 * Dados de exemplo (modo offline) trazidos para as datas atuais.
 * Pertencem ao primeiro perfil; os demais perfis começam vazios.
 */
import { CREDIT_CARDS, CURRENT_MONTH_TRANSACTIONS, DEBTS } from '@/lib/mock-data';
import { DEFAULT_CLOSING_DAY, addMonths, currentMonthKey, invoiceMonthOf } from './credit-card';
import { addMonthsToDate, dateInMonth, todayISO, type DebtPayment, type Goal, type Subscription } from './engine';

// Transações de assinatura do exemplo antigo: agora são geradas pelas assinaturas
const SUBSCRIPTION_TX_IDS = new Set(['8', '9', '10', '11', '12']);

export function seedCards(profileId: string) {
  return CREDIT_CARDS.map(card => ({ ...card, profile_id: profileId }));
}

export function seedTransactions(profileId: string) {
  const month = currentMonthKey();
  const closingOf = new Map<string, number>(CREDIT_CARDS.map(c => [c.id, c.closingDay]));
  return CURRENT_MONTH_TRANSACTIONS.filter(tx => !SUBSCRIPTION_TX_IDS.has(tx.id)).map((tx: any) => {
    const date = dateInMonth(month, Number(tx.date.slice(8, 10)));
    const base = { ...tx, date, profile_id: profileId };
    if (!tx.cardId) return { ...base, paymentMethod: 'cash' };
    return {
      ...base,
      paymentMethod: 'credit_card',
      installments: 1,
      firstInstallment: 1,
      firstInvoiceMonth: invoiceMonthOf(date, closingOf.get(tx.cardId) ?? DEFAULT_CLOSING_DAY),
    };
  });
}

/** Dívidas de exemplo; a parcela deste mês que já venceu aparece como paga */
export function seedDebts(profileId: string): { debts: any[]; payments: DebtPayment[] } {
  const today = todayISO();
  const payments: DebtPayment[] = [];
  const debts = DEBTS.map(debt => {
    const dueThisMonth = dateInMonth(currentMonthKey(), Number(debt.nextDueDate.slice(8, 10)));
    const alreadyPaid = dueThisMonth < today;
    if (alreadyPaid) {
      payments.push({
        id: `seed-pay-${debt.id}`,
        profile_id: profileId,
        debtId: debt.id,
        date: dueThisMonth,
        amount: debt.monthlyPayment,
        installments: 1,
        kind: 'installment',
      });
    }
    return {
    id: debt.id,
    profile_id: profileId,
    name: debt.name,
    type: debt.type,
    totalAmount: debt.totalAmount,
    remainingAmount: debt.remainingAmount,
    monthlyPayment: debt.monthlyPayment,
    interestRate: debt.interestRate,
    installmentsPaid: debt.installmentsPaid,
    totalInstallments: debt.totalInstallments,
    nextDueDate: alreadyPaid ? addMonthsToDate(dueThisMonth, 1) : dueThisMonth,
    creditor: debt.creditor,
    color: debt.color,
    status: 'active',
    };
  });
  return { debts, payments };
}

export function seedSubscriptions(profileId: string): Subscription[] {
  // Ativas desde 3 meses atrás, cobradas no Nubank (id '1')
  const start = `${addMonths(currentMonthKey(), -3)}-01`;
  const base = { profile_id: profileId, frequency: 'monthly' as const, paymentMethod: 'credit_card' as const, cardId: '1' };
  return [
    { ...base, id: 'sub-1', name: 'Netflix', category: 'Lazer', amount: 55.9, billingDay: 10, icon: '🎬', status: 'active', periods: [{ start }] },
    { ...base, id: 'sub-2', name: 'Spotify Premium', category: 'Lazer', amount: 21.9, billingDay: 15, icon: '🎵', status: 'active', periods: [{ start }] },
    { ...base, id: 'sub-3', name: 'Amazon Prime', category: 'Lazer', amount: 14.9, billingDay: 20, icon: '📦', status: 'active', periods: [{ start }] },
    { ...base, id: 'sub-4', name: 'GitHub Pro', category: 'Educação', amount: 4, billingDay: 25, icon: '💻', status: 'active', periods: [{ start }] },
    {
      ...base,
      id: 'sub-5',
      name: 'Adobe Creative Cloud',
      category: 'Trabalho',
      amount: 99,
      billingDay: 28,
      icon: '🎨',
      status: 'paused',
      // pausada no início do mês passado: cobrou até lá
      periods: [{ start, end: `${addMonths(currentMonthKey(), -1)}-01` }],
    },
  ];
}

export function seedGoals(profileId: string): Goal[] {
  const month = currentMonthKey();
  const inMonths = (n: number) => dateInMonth(addMonths(month, n), 28);
  const created = `${addMonths(month, -6)}-01`;
  const aporte = (id: string, amount: number) => [{ id, date: todayISO(), amount }];
  const base = { profile_id: profileId, createdAt: created, status: 'active' as const };
  return [
    { ...base, id: 'goal-1', name: 'Fundo de Emergência', icon: '🛡️', type: 'emergency', targetAmount: 30000, initialAmount: 14500, deadline: inMonths(12), monthlyContribution: 1000, autoContribute: true, contributions: aporte('c1', 500) },
    { ...base, id: 'goal-2', name: 'Viagem para Europa', icon: '✈️', type: 'vacation', targetAmount: 15000, initialAmount: 8500, deadline: inMonths(10), monthlyContribution: 500, autoContribute: true, contributions: [] },
    { ...base, id: 'goal-3', name: 'Notebook Novo', icon: '💻', type: 'purchase', targetAmount: 8000, initialAmount: 6200, deadline: inMonths(4), monthlyContribution: 450, autoContribute: false, contributions: [] },
    { ...base, id: 'goal-4', name: 'Curso de Especialização', icon: '📚', type: 'other', targetAmount: 5000, initialAmount: 4800, deadline: inMonths(2), monthlyContribution: 0, autoContribute: false, status: 'paused', contributions: [] },
  ];
}
