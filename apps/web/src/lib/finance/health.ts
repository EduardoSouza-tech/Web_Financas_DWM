/**
 * Indicadores de saúde financeira do mês, calculados a partir dos dados reais do perfil.
 * Todas as porcentagens retornam 0 quando não há renda (evita NaN/Infinity na tela).
 */

const pct = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);

export interface FinancialHealth {
  income: number;
  expenses: number;
  debtPayments: number;
  availableAfterExpenses: number;
  availableAfterDebts: number;
  debtCommitmentPercentage: number;
  savingsRate: number;
  realSavingsRate: number;
  isInDeficit: boolean;
}

export function computeHealth(income: number, expenses: number, debtPayments: number): FinancialHealth {
  const availableAfterExpenses = income - expenses;
  const availableAfterDebts = availableAfterExpenses - debtPayments;
  return {
    income,
    expenses,
    debtPayments,
    availableAfterExpenses,
    availableAfterDebts,
    debtCommitmentPercentage: pct(debtPayments, income),
    savingsRate: pct(availableAfterExpenses, income),
    realSavingsRate: pct(availableAfterDebts, income),
    isInDeficit: availableAfterDebts < 0,
  };
}

/** Como fica o mês se a parcela de uma dívida deixar de existir */
export function simulateDebtPayoff(health: FinancialHealth, monthlyPayment: number) {
  const after = computeHealth(health.income, health.expenses, Math.max(0, health.debtPayments - monthlyPayment));
  return {
    ...after,
    freedAmount: monthlyPayment,
    willBePositive: after.availableAfterDebts > 0,
    leavesDeficit: health.isInDeficit && !after.isInDeficit,
  };
}

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  icon: string;
  title: string;
  message: string;
  impact?: string;
}

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function generateInsights(
  health: FinancialHealth,
  debts: Array<{ name: string; interestRate: number; monthlyPayment: number; remainingAmount: number }>,
  expensesByCategory: Record<string, number>
): Insight[] {
  const insights: Insight[] = [];
  const { income, debtPayments, debtCommitmentPercentage, availableAfterDebts, isInDeficit, realSavingsRate } = health;

  if (income <= 0 && health.expenses <= 0 && debtPayments <= 0) {
    return [
      {
        id: 'no-data',
        type: 'info',
        icon: '📝',
        title: 'Sem lançamentos neste mês',
        message: 'Cadastre receitas e despesas para ver a análise da sua saúde financeira.',
      },
    ];
  }

  if (income <= 0) {
    insights.push({
      id: 'no-income',
      type: 'warning',
      icon: '⚠️',
      title: 'Nenhuma receita registrada no mês',
      message: `Há ${brl(health.expenses + debtPayments)} em despesas e parcelas sem nenhuma receita lançada.`,
      impact: 'Lance suas receitas para que as porcentagens e alertas façam sentido.',
    });
  }

  if (income > 0 && !isInDeficit && debtCommitmentPercentage < 30) {
    insights.push({
      id: 'financial-health-good',
      type: 'success',
      icon: '✅',
      title: 'Saúde Financeira Estável',
      message: `Você está no verde! Sobram ${realSavingsRate.toFixed(1)}% da renda depois de despesas e dívidas.`,
      impact: 'Continue assim e você atingirá suas metas financeiras!',
    });
  }

  if (income > 0 && !isInDeficit && debtCommitmentPercentage >= 30) {
    insights.push({
      id: 'debt-manageable',
      type: 'warning',
      icon: '⚠️',
      title: 'Dívidas Altas mas Controláveis',
      message: `${debtCommitmentPercentage.toFixed(1)}% da renda em dívidas. Ainda sobra ${brl(availableAfterDebts)}/mês.`,
      impact: 'Foque em quitar as dívidas com maiores juros para liberar mais renda.',
    });
  }

  if (income > 0 && isInDeficit && debtCommitmentPercentage > 50) {
    insights.push({
      id: 'critical-situation',
      type: 'warning',
      icon: '🚨',
      title: 'Situação Crítica de Endividamento',
      message: `Mais de 50% da renda em dívidas e déficit de ${brl(Math.abs(availableAfterDebts))}/mês.`,
      impact: 'URGENTE: Considere renegociar dívidas ou buscar renda extra.',
    });
  }

  // Maior categoria de gasto real do mês
  const topCategory = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0];
  if (isInDeficit && topCategory && topCategory[1] > 0) {
    insights.push({
      id: 'reduce-top-expense',
      type: 'tip',
      icon: '💡',
      title: 'Oportunidade de Economia',
      message: `Sua maior despesa é ${topCategory[0]} (${brl(topCategory[1])}). Reduzindo 20%, economiza ${brl(topCategory[1] * 0.2)}/mês.`,
      impact: 'Pequenos ajustes nas maiores categorias geram grande impacto!',
    });
  }

  const activeDebts = debts.filter(d => d.remainingAmount > 0);
  if (debtPayments > 0 && activeDebts.length > 0) {
    const highest = [...activeDebts].sort((a, b) => b.interestRate - a.interestRate)[0];
    const afterPayoff = availableAfterDebts + highest.monthlyPayment;
    insights.push({
      id: 'debt-payoff-simulation',
      type: 'info',
      icon: '🎯',
      title: 'Simulação de Quitação',
      message: `Quitando "${highest.name}" (${highest.interestRate}% a.m.), você terá ${brl(afterPayoff)}/mês disponível.`,
      impact:
        afterPayoff > 0
          ? isInDeficit
            ? '✅ Você sairá do vermelho!'
            : `✅ Libera mais ${brl(highest.monthlyPayment)}/mês.`
          : `Ainda faltarão ${brl(Math.abs(afterPayoff))} para equilibrar.`,
    });
  }

  if (income > 0 && debtPayments === 0 && !isInDeficit) {
    insights.push({
      id: 'debt-free',
      type: 'success',
      icon: '🎉',
      title: 'Livre de Dívidas!',
      message: `Parabéns! Você está sem dívidas e sobram ${realSavingsRate.toFixed(1)}% da renda.`,
      impact: 'Agora é hora de focar em investimentos e metas de longo prazo!',
    });
  }

  if (income > 0 && realSavingsRate >= 20 && !isInDeficit) {
    insights.push({
      id: 'excellent-savings',
      type: 'success',
      icon: '💰',
      title: 'Taxa de Poupança Excelente',
      message: `Sobram ${realSavingsRate.toFixed(1)}% da renda! Isso é acima da média brasileira (6%).`,
      impact: 'Mantenha esse ritmo e você terá uma aposentadoria tranquila!',
    });
  }

  return insights;
}
