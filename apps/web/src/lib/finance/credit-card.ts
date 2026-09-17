/**
 * Regras de fatura de cartão de crédito.
 *
 * - Mês da fatura = mês em que ela FECHA (ex.: "2026-09" fecha em 05/09/2026).
 * - Compra feita ATÉ o dia de fechamento (inclusive) entra na fatura que fecha naquele mês;
 *   depois do fechamento, entra na fatura do mês seguinte.
 * - A parcela k de uma compra cai na fatura (primeira fatura + k - 1).
 * - Nas análises, cada parcela conta como despesa no mês da sua fatura.
 */

export const DEFAULT_CLOSING_DAY = 5;

/** 'YYYY-MM' */
export type MonthKey = string;

export interface CardPurchase {
  id: string;
  profile_id?: string;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD (data da compra)
  amount: number; // valor TOTAL da compra
  cardId: string;
  installments?: number; // total de parcelas (padrão 1)
  firstInstallment?: number; // primeira parcela lançada no sistema (padrão 1)
  firstInvoiceMonth?: MonthKey; // fatura da parcela 1 (calculada no cadastro)
}

export interface Installment {
  key: string; // `${purchaseId}#${number}`
  purchaseId: string;
  profile_id?: string;
  cardId: string;
  description: string;
  category: string;
  purchaseDate: string;
  number: number;
  total: number;
  amount: number;
  invoiceMonth: MonthKey;
}

export function toMonthKey(year: number, month1to12: number): MonthKey {
  return `${year}-${String(month1to12).padStart(2, '0')}`;
}

export function currentMonthKey(today = new Date()): MonthKey {
  return toMonthKey(today.getFullYear(), today.getMonth() + 1);
}

export function addMonths(month: MonthKey, n: number): MonthKey {
  const [y, m] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + n;
  return toMonthKey(Math.floor(index / 12), (index % 12) + 1);
}

export function monthOfDate(date: string): MonthKey {
  return date.slice(0, 7);
}

/** Fatura em que uma compra feita em `date` entra */
export function invoiceMonthOf(date: string, closingDay = DEFAULT_CLOSING_DAY): MonthKey {
  const day = Number(date.slice(8, 10));
  const month = monthOfDate(date);
  return day <= closingDay ? month : addMonths(month, 1);
}

function lastDayOfMonth(month: MonthKey): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/** Período de compras de uma fatura: do dia seguinte ao fechamento anterior até o fechamento */
export function invoicePeriod(month: MonthKey, closingDay = DEFAULT_CLOSING_DAY) {
  const prev = addMonths(month, -1);
  const prevClosing = Math.min(closingDay, lastDayOfMonth(prev));
  const closing = Math.min(closingDay, lastDayOfMonth(month));
  // dia seguinte ao fechamento anterior
  const start = new Date(Number(prev.slice(0, 4)), Number(prev.slice(5, 7)) - 1, prevClosing + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    start: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    end: `${month}-${pad(closing)}`,
  };
}

/** Divide em centavos; a última parcela absorve a sobra do arredondamento */
export function splitAmount(total: number, installments: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / installments);
  return Array.from({ length: installments }, (_, i) =>
    (i === installments - 1 ? cents - base * (installments - 1) : base) / 100
  );
}

export function expandInstallments(purchase: CardPurchase, closingDay = DEFAULT_CLOSING_DAY): Installment[] {
  const total = Math.max(1, purchase.installments ?? 1);
  const first = Math.min(Math.max(1, purchase.firstInstallment ?? 1), total);
  const firstInvoice = purchase.firstInvoiceMonth ?? invoiceMonthOf(purchase.date, closingDay);
  const amounts = splitAmount(purchase.amount, total);

  const result: Installment[] = [];
  for (let n = first; n <= total; n++) {
    result.push({
      key: `${purchase.id}#${n}`,
      purchaseId: purchase.id,
      profile_id: purchase.profile_id,
      cardId: purchase.cardId,
      description: purchase.description,
      category: purchase.category,
      purchaseDate: purchase.date,
      number: n,
      total,
      amount: amounts[n - 1],
      invoiceMonth: addMonths(firstInvoice, n - 1),
    });
  }
  return result;
}

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function formatMonth(month: MonthKey, short = false): string {
  const [y, m] = month.split('-').map(Number);
  const name = MONTH_NAMES[m - 1];
  return short ? `${name.slice(0, 3)}/${y}` : `${name}/${y}`;
}

export function formatDateBR(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}
