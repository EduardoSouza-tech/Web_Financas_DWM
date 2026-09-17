/**
 * Alertas do mês gerados a partir dos dados reais do perfil.
 */
import { formatDateBR } from './credit-card';
import { goalMonthlyNeeded, goalPercentage, todayISO, type Goal } from './engine';
import type { FinancialHealth } from './health';

export interface FinanceAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function generateAlerts(input: {
  health: FinancialHealth;
  expectedIncome: number;
  budgets: Array<{ category: { name: string }; limit: number; spent: number }>;
  goals: Goal[];
  cards: Array<{ name: string; nextInvoice: number; nextDueDate: string }>;
  isCurrentMonth: boolean;
  today?: string;
}): FinanceAlert[] {
  const { health, expectedIncome, budgets, goals, cards, isCurrentMonth } = input;
  const today = input.today ?? todayISO();
  const alerts: FinanceAlert[] = [];

  budgets
    .filter(b => b.spent > b.limit)
    .forEach(b =>
      alerts.push({
        id: `budget-over-${b.category.name}`,
        type: 'danger',
        title: `Orçamento de ${b.category.name} estourado`,
        message: `Gastou ${brl(b.spent)} de ${brl(b.limit)} (${brl(b.spent - b.limit)} acima).`,
      })
    );

  budgets
    .filter(b => b.spent <= b.limit && b.limit > 0 && b.spent / b.limit >= 0.8)
    .forEach(b =>
      alerts.push({
        id: `budget-near-${b.category.name}`,
        type: 'warning',
        title: `${b.category.name} perto do limite`,
        message: `${((b.spent / b.limit) * 100).toFixed(0)}% usado: restam ${brl(b.limit - b.spent)}.`,
      })
    );

  if (health.income > 0 && health.debtCommitmentPercentage > 30) {
    alerts.push({
      id: 'debt-high',
      type: 'warning',
      title: 'Comprometimento com dívidas alto',
      message: `${health.debtCommitmentPercentage.toFixed(1)}% da renda vai para parcelas (recomendado: até 30%).`,
    });
  }

  if (expectedIncome > 0 && health.income < expectedIncome) {
    alerts.push({
      id: 'income-below-expected',
      type: isCurrentMonth ? 'info' : 'warning',
      title: 'Receita abaixo do esperado',
      message: `Lançado ${brl(health.income)} de ${brl(expectedIncome)} esperados${isCurrentMonth ? ' (o mês ainda não acabou)' : ''}.`,
    });
  }

  if (isCurrentMonth) {
    const inTenDays = new Date(`${today}T12:00:00`);
    inTenDays.setDate(inTenDays.getDate() + 10);
    const limit = inTenDays.toISOString().slice(0, 10);
    cards
      .filter(c => c.nextInvoice > 0 && c.nextDueDate >= today && c.nextDueDate <= limit)
      .forEach(c =>
        alerts.push({
          id: `invoice-${c.name}`,
          type: 'info',
          title: `Fatura do ${c.name} vence em breve`,
          message: `${brl(c.nextInvoice)} com vencimento em ${formatDateBR(c.nextDueDate)}.`,
        })
      );
  }

  goals
    .filter(g => g.status === 'active' && goalPercentage(g) < 100 && g.monthlyContribution < goalMonthlyNeeded(g, today))
    .forEach(g =>
      alerts.push({
        id: `goal-behind-${g.id}`,
        type: 'warning',
        title: `Meta "${g.name}" fora do ritmo`,
        message: `Precisa de ${brl(goalMonthlyNeeded(g, today))}/mês até ${formatDateBR(g.deadline)}; o planejado é ${brl(g.monthlyContribution)}.`,
      })
    );

  return alerts;
}
