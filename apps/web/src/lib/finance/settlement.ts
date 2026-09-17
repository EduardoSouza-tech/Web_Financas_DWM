/**
 * Acerto de contas da família: quem deve a quem.
 *
 * Quando alguém paga uma despesa dividida, os outros perfis ficam devendo a parte deles
 * a quem pagou. Numa receita dividida, é o contrário: quem recebeu deve repassar as partes.
 * Em dívida dividida cada um paga a sua parte direto no boleto, então ela não gera saldo
 * entre perfis — só aparece o que cada um ainda tem para pagar.
 */

import type { Split } from './credit-card';

/** Uma movimentação que gera saldo entre perfis */
export interface SharedItem {
  /** Quem desembolsou (despesa) ou recebeu (receita) — dono do cartão, no crédito */
  payerProfileId: string;
  direction: 'expense' | 'income';
  splits: Split[];
  description?: string;
  date?: string;
}

/** Saldo de um perfil: positivo = tem a receber, negativo = tem a pagar */
export interface Balance {
  profile_id: string;
  amount: number;
}

export interface Transfer {
  from: string; // quem paga
  to: string; // quem recebe
  amount: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Saldo líquido de cada perfil a partir das movimentações divididas */
export function computeBalances(items: SharedItem[]): Balance[] {
  const totals = new Map<string, number>();
  const add = (profileId: string, amount: number) => {
    totals.set(profileId, (totals.get(profileId) ?? 0) + amount);
  };

  items.forEach(item => {
    if (item.splits.length < 2) return; // só o próprio perfil: não gera saldo
    const sign = item.direction === 'expense' ? 1 : -1;
    item.splits.forEach(share => {
      if (share.profile_id === item.payerProfileId) return; // a parte de quem pagou se anula
      add(item.payerProfileId, sign * share.amount);
      add(share.profile_id, -sign * share.amount);
    });
  });

  return Array.from(totals.entries())
    .map(([profile_id, amount]) => ({ profile_id, amount: round(amount) }))
    .filter(b => Math.abs(b.amount) >= 0.01)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Menor número de transferências que zera os saldos:
 * quem mais deve paga a quem mais tem a receber, até sobrar nada.
 */
export function settleBalances(balances: Balance[]): Transfer[] {
  const creditors = balances.filter(b => b.amount > 0).map(b => ({ ...b })).sort((a, b) => b.amount - a.amount);
  const debtors = balances.filter(b => b.amount < 0).map(b => ({ ...b, amount: -b.amount })).sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = round(Math.min(debtors[i].amount, creditors[j].amount));
    if (amount >= 0.01) {
      transfers.push({ from: debtors[i].profile_id, to: creditors[j].profile_id, amount });
    }
    debtors[i].amount = round(debtors[i].amount - amount);
    creditors[j].amount = round(creditors[j].amount - amount);
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }
  return transfers;
}

/** Quanto um perfil tem a receber (positivo) ou a pagar (negativo) */
export function balanceOf(balances: Balance[], profileId: string | null | undefined): number {
  if (!profileId) return 0;
  return balances.find(b => b.profile_id === profileId)?.amount ?? 0;
}
