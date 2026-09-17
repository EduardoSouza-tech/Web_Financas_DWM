/**
 * Conquistas de dívidas quitadas, guardadas no navegador (localStorage).
 * Cada conquista pertence a um perfil; a visão Família mostra todas.
 */

export interface DebtAchievement {
  id: string;
  profile_id?: string;
  debtId: string;
  debtName: string;
  amount: number;
  paidAt: string;
  monthlyPaymentFreed: number;
  interestRate: number;
}

const STORAGE_KEY = 'debtAchievements';

export function loadAchievements(): DebtAchievement[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const list = saved ? JSON.parse(saved) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persist(list: DebtAchievement[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage indisponível: conquista fica só nesta sessão
  }
}

/** Registra a quitação; ignora se a mesma dívida do mesmo perfil já foi registrada */
export function addAchievement(
  debt: { id: string; profile_id?: string; name: string; remainingAmount: number; monthlyPayment: number; interestRate: number },
  amountPaid = debt.remainingAmount
): DebtAchievement[] {
  const list = loadAchievements();
  if (list.some(a => a.debtId === debt.id && a.profile_id === debt.profile_id)) return list;

  const next = [
    ...list,
    {
      id: `achievement-${debt.id}-${Date.now()}`,
      profile_id: debt.profile_id,
      debtId: debt.id,
      debtName: debt.name,
      amount: amountPaid,
      paidAt: new Date().toISOString(),
      monthlyPaymentFreed: debt.monthlyPayment,
      interestRate: debt.interestRate,
    },
  ];
  persist(next);
  return next;
}

/** Remove as conquistas visíveis (do perfil ativo, ou todas na visão Família) */
export function clearAchievements(isVisible: (a: DebtAchievement) => boolean): DebtAchievement[] {
  const next = loadAchievements().filter(a => !isVisible(a));
  persist(next);
  return next;
}
