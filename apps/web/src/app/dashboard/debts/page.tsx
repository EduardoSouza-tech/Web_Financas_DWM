'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingDown, DollarSign, Calendar, AlertTriangle, CheckCircle, X, Sparkles, TrendingUp, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { computeHealth, simulateDebtPayoff } from '@/lib/finance/health';
import { useFinance } from '@/contexts/FinanceContext';
import { useConfirm } from '@/providers/confirm-provider';

interface Debt {
  id: string;
  name: string;
  type: 'loan' | 'financing' | 'credit' | 'other';
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  interestRate: number;
  installmentsPaid: number;
  totalInstallments: number;
  nextDueDate: string;
  creditor: string;
  color: string;
}

export default function DebtsPage() {
  const confirm = useConfirm();
  const {
    debts,
    paidDebts,
    debtPayments,
    addDebt,
    deleteDebt,
    payDebtInstallment,
    advanceDebtInstallments,
    payOffDebt,
    getTotalIncome,
    getTotalExpenses,
    getTotalDebtPayments,
    getMonthlyDebtCommitment,
    referenceMonth,
  } = useFinance();
  const health = computeHealth(getTotalIncome(), getTotalExpenses(), getTotalDebtPayments());
  const [paidMessage, setPaidMessage] = useState<string | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [installmentsToAdvance, setInstallmentsToAdvance] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayOffModal, setShowPayOffModal] = useState(false);
  const [debtToPayOff, setDebtToPayOff] = useState<Debt | null>(null);
  const [amountMode, setAmountMode] = useState<'installment' | 'total'>('installment');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('debt_amount_mode');
      if (saved === 'installment' || saved === 'total') setAmountMode(saved);
    } catch {
      // storage indisponível: fica o padrão
    }
  }, []);
  const changeAmountMode = (mode: 'installment' | 'total') => {
    setAmountMode(mode);
    try {
      localStorage.setItem('debt_amount_mode', mode);
    } catch {
      // storage indisponível
    }
  };

  const [debtForm, setDebtForm] = useState({
    name: '',
    type: 'loan' as 'loan' | 'financing' | 'credit' | 'other',
    totalAmount: '',
    interestRate: '',
    totalInstallments: '',
    installmentsPaid: '',
    nextDueDate: '',
    creditor: ''
  });

  const handlePayOffDebt = (debtId: string) => {
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      setDebtToPayOff(debt);
      setShowPayOffModal(true);
    }
  };

  const confirmPayOff = () => {
    if (!debtToPayOff) return;

    // Registra o pagamento do saldo, marca como quitada (fica no histórico) e gera a conquista
    payOffDebt(debtToPayOff.id);

    setPaidMessage(`🎉 Parabéns! Dívida "${debtToPayOff.name}" quitada totalmente! Você liberou ${debtToPayOff.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês!`);

    // Remove a mensagem após 8 segundos
    setTimeout(() => {
      setPaidMessage(null);
    }, 8000);

    setShowPayOffModal(false);
    setDebtToPayOff(null);
  };

  const handleAdvanceInstallments = () => {
    if (!selectedDebt) return;

    const remainingInstallments = selectedDebt.totalInstallments - selectedDebt.installmentsPaid;
    const actualInstallments = Math.min(installmentsToAdvance, remainingInstallments);
    const amountPaid = actualInstallments * selectedDebt.monthlyPayment;
    const newRemainingAmount = selectedDebt.remainingAmount - amountPaid;
    const newInstallmentsPaid = selectedDebt.installmentsPaid + actualInstallments;

    advanceDebtInstallments(selectedDebt.id, actualInstallments);
    if (newRemainingAmount <= 0 || newInstallmentsPaid >= selectedDebt.totalInstallments) {
      setPaidMessage(`✅ Você adiantou ${actualInstallments} parcela(s) de "${selectedDebt.name}" e QUITOU a dívida! 🎉`);
    } else {
      setPaidMessage(`✅ Você adiantou ${actualInstallments} parcela(s) de "${selectedDebt.name}" (${amountPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}). O vencimento do mês continua.`);
    }

    // Fecha o diálogo e reseta
    setSelectedDebt(null);
    setInstallmentsToAdvance(1);

    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      setPaidMessage(null);
    }, 5000);
  };

  const handleAddDebt = () => {
    if (!debtFormValid) return;

    // Valores já com juros. A taxa é só informativa (serve para priorizar a quitação das dívidas mais caras).
    const { totalAmount, monthlyPayment, remainingAmount } = formPlan;
    const totalInstallments = formInstallments;
    const installmentsPaid = formPaid;
    const interestRate = parseFloat(debtForm.interestRate) || 0;

    const colors = ['from-blue-500 to-blue-700', 'from-purple-500 to-purple-700', 'from-orange-500 to-orange-700', 'from-green-500 to-green-700'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newDebt = {
      name: debtForm.name,
      type: debtForm.type,
      totalAmount,
      remainingAmount,
      monthlyPayment,
      interestRate,
      installmentsPaid,
      totalInstallments,
      nextDueDate: debtForm.nextDueDate,
      creditor: debtForm.creditor || 'Não informado',
      color: randomColor
    };

    addDebt(newDebt);
    setDebtForm({ name: '', type: 'loan', totalAmount: '', interestRate: '', totalInstallments: '', installmentsPaid: '', nextDueDate: '', creditor: '' });
    setShowAddModal(false);
  };

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const formAmount = parseFloat(debtForm.totalAmount);
  const formInstallments = parseInt(debtForm.totalInstallments);
  const formPaid = parseInt(debtForm.installmentsPaid) || 0;
  // Parcela informada: total = parcela x parcelas (exato).
  // Total informado: parcela = total / parcelas (centavos arredondados; a última paga o que faltar).
  const formPlan = (() => {
    if (!(formAmount > 0) || !(formInstallments >= 1)) return { totalAmount: 0, monthlyPayment: 0, remainingAmount: 0 };
    const monthlyPayment = amountMode === 'installment' ? round2(formAmount) : round2(formAmount / formInstallments);
    const totalAmount = amountMode === 'installment' ? round2(monthlyPayment * formInstallments) : round2(formAmount);
    const remainingAmount = Math.max(0, round2(totalAmount - monthlyPayment * formPaid));
    return { totalAmount, monthlyPayment, remainingAmount };
  })();
  const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const debtFormValid =
    !!debtForm.name.trim() &&
    formAmount > 0 &&
    formInstallments >= 1 &&
    formPaid >= 0 &&
    formPaid < formInstallments &&
    /^\d{4}-\d{2}-\d{2}$/.test(debtForm.nextDueDate);

  const totalDebt = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const totalMonthly = getMonthlyDebtCommitment();

  const handlePayInstallment = (debt: Debt) => {
    const finishing = debt.installmentsPaid + 1 >= debt.totalInstallments;
    payDebtInstallment(debt.id);
    setPaidMessage(
      finishing
        ? `🎉 Última parcela de "${debt.name}" paga. Dívida quitada!`
        : `✅ Parcela de "${debt.name}" paga (${debt.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}). Próximo vencimento avançou um mês.`
    );
    setTimeout(() => setPaidMessage(null), 5000);
  };

  const monthPayments = debtPayments
    .filter(p => p.date.slice(0, 7) === referenceMonth)
    .sort((a, b) => b.date.localeCompare(a.date));
  const debtName = (id: string) => [...debts, ...paidDebts].find(d => d.id === id)?.name ?? 'Dívida excluída';
  const kindLabel = { installment: 'Parcela', advance: 'Adiantamento', payoff: 'Quitação' } as const;

  const handleDeleteDebt = async (debt: { id: string; name: string }) => {
    const payments = debtPayments.filter(p => p.debtId === debt.id);
    const total = payments.reduce((s, p) => s + p.amount, 0);
    const ok = await confirm({
      title: `Excluir a dívida "${debt.name}"?`,
      message:
        (payments.length > 0
          ? `Também serão apagados ${payments.length} pagamento(s) registrados (${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}), que saem das análises, e a conquista dela.

`
          : '') + 'Use para lançamentos errados ou de teste. Para manter o histórico, use "Quitar Totalmente".',
      confirmLabel: 'Excluir dívida',
      destructive: true,
    });
    if (ok) deleteDebt(debt.id);
  };
  const totalPaid = debts.reduce((sum, debt) => sum + (debt.totalAmount - debt.remainingAmount), 0);
  const averageInterest = debts.length > 0 ? debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length : 0;

  return (
    <div className="space-y-8">
      {/* Add Debt Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background border rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Adicionar Dívida</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome da Dívida</label>
                  <Input
                    placeholder="Ex: Financiamento do Carro"
                    value={debtForm.name}
                    onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo</label>
                  <select
                    value={debtForm.type}
                    onChange={(e) => setDebtForm({ ...debtForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border rounded-md"
                  >
                    <option value="loan">Empréstimo</option>
                    <option value="financing">Financiamento</option>
                    <option value="credit">Cartão de Crédito</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="text-sm font-medium" htmlFor="debt-amount">
                      {amountMode === 'installment' ? 'Valor da parcela' : 'Valor total (já com juros)'}
                    </label>
                    <div className="inline-flex rounded-lg border border-border p-0.5 text-xs" role="radiogroup" aria-label="Como informar o valor">
                      {([
                        ['installment', 'Parcela'],
                        ['total', 'Total'],
                      ] as const).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          role="radio"
                          aria-checked={amountMode === mode}
                          onClick={() => changeAmountMode(mode)}
                          className={`rounded-md px-3 py-1 font-medium transition ${
                            amountMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    id="debt-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={amountMode === 'installment' ? 'Valor de cada parcela, como no contrato' : 'Soma de todas as parcelas'}
                    value={debtForm.totalAmount}
                    onChange={(e) => setDebtForm({ ...debtForm, totalAmount: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Total de parcelas</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="24"
                      value={debtForm.totalInstallments}
                      onChange={(e) => setDebtForm({ ...debtForm, totalInstallments: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Parcelas já pagas</label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={debtForm.installmentsPaid}
                      onChange={(e) => setDebtForm({ ...debtForm, installmentsPaid: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Próximo vencimento</label>
                    <Input
                      type="date"
                      value={debtForm.nextDueDate}
                      onChange={(e) => setDebtForm({ ...debtForm, nextDueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Juros ao mês (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Opcional"
                      value={debtForm.interestRate}
                      onChange={(e) => setDebtForm({ ...debtForm, interestRate: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Só para priorizar a quitação</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Credor</label>
                  <Input
                    placeholder="Ex: Banco Inter"
                    value={debtForm.creditor}
                    onChange={(e) => setDebtForm({ ...debtForm, creditor: e.target.value })}
                  />
                </div>

                {formAmount > 0 && formInstallments >= 1 && (
                  <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                    <p>
                      Parcela <strong>{brl(formPlan.monthlyPayment)}</strong> × {formInstallments} = total{' '}
                      <strong>{brl(formPlan.totalAmount)}</strong>
                    </p>
                    {formPaid > 0 && formPaid < formInstallments && (
                      <p>
                        Restam <strong>{formInstallments - formPaid} parcelas</strong>, saldo de{' '}
                        <strong>{brl(formPlan.remainingAmount)}</strong>
                      </p>
                    )}
                    {formPaid >= formInstallments && (
                      <p className="text-red-500">As parcelas pagas precisam ser menores que o total.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleAddDebt} className="flex-1" disabled={!debtFormValid}>
                  Adicionar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dívidas</h1>
          <p className="text-muted-foreground">Gerencie e elimine suas dívidas de forma inteligente</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Adicionar Dívida
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dívida Total</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalDebt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {debts.length} dívidas ativas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamento Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {totalMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Comprometimento mensal
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Progresso de quitação
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageInterest.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Juros médio mensal
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mensagem de Sucesso */}
      <AnimatePresence>
        {paidMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">{paidMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Adiantamento */}
      <AnimatePresence>
        {selectedDebt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDebt(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background border rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Adiantar Parcelas</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedDebt(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dívida</p>
                  <p className="font-semibold">{selectedDebt.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Restante</p>
                    <p className="font-semibold text-red-600">
                      {selectedDebt.remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Parcelas Restantes</p>
                    <p className="font-semibold">
                      {selectedDebt.totalInstallments - selectedDebt.installmentsPaid}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Quantas parcelas deseja adiantar?
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedDebt.totalInstallments - selectedDebt.installmentsPaid}
                    value={installmentsToAdvance}
                    onChange={(e) => setInstallmentsToAdvance(Math.max(1, Math.min(selectedDebt.totalInstallments - selectedDebt.installmentsPaid, parseInt(e.target.value) || 1)))}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max={selectedDebt.totalInstallments - selectedDebt.installmentsPaid}
                      value={installmentsToAdvance}
                      onChange={(e) => setInstallmentsToAdvance(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-semibold w-16 text-right">
                      {installmentsToAdvance}x
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Valor por parcela</span>
                    <span className="font-semibold">
                      {selectedDebt.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total a pagar</span>
                    <span className="font-bold text-lg text-blue-600">
                      {(installmentsToAdvance * selectedDebt.monthlyPayment).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedDebt(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleAdvanceInstallments}
                  >
                    Confirmar Adiantamento
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debts List */}
      {debts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Parabéns! 🎉</h3>
          <p className="text-muted-foreground">Você não possui dívidas ativas no momento.</p>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {debts.map((debt, index) => {
            const paidPercent = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
            const daysUntilDue = Math.ceil((new Date(debt.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: -100 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{debt.name}</CardTitle>
                        <CardDescription>{debt.creditor}</CardDescription>
                      </div>
                      <Badge variant="danger">
                        {debt.interestRate}% a.m.
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-semibold">{paidPercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={paidPercent} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{debt.installmentsPaid} de {debt.totalInstallments} parcelas</span>
                      <span>{debt.totalInstallments - debt.installmentsPaid} restantes</span>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold">
                        {debt.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Restante</p>
                      <p className="font-semibold text-red-600">
                        {debt.remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>

                  {/* Monthly Payment */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Parcela mensal</span>
                      <span className="font-bold text-lg">
                        {debt.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>

                  {/* Next Payment */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Próximo vencimento</span>
                    <Badge variant={daysUntilDue <= 5 ? 'danger' : 'secondary'}>
                      {daysUntilDue} dias
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={() => handlePayInstallment(debt)}
                    >
                      Pagar parcela ({new Date(`${debt.nextDueDate}T12:00:00`).toLocaleDateString('pt-BR')})
                    </Button>
                    <Button
                      variant="default"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setSelectedDebt(debt)}
                    >
                      Adiantar Parcelas
                    </Button>
                    <Button 
                      variant="default" 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handlePayOffDebt(debt.id)}
                    >
                      Quitar Totalmente
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => handleDeleteDebt(debt)}
                    >
                      Excluir (lançamento errado)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagamentos do mês e dívidas quitadas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamentos registrados no mês</CardTitle>
            <CardDescription>Entram no saldo do mês; o que ainda vai vencer também é contado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {monthPayments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pagamento registrado neste mês.</p>}
            {monthPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                <div>
                  <p className="font-medium">{debtName(p.debtId)}</p>
                  <p className="text-xs text-muted-foreground">
                    {kindLabel[p.kind]} · {new Date(`${p.date}T12:00:00`).toLocaleDateString('pt-BR')}
                    {p.installments > 1 ? ` · ${p.installments} parcelas` : ''}
                  </p>
                </div>
                <span className="font-semibold text-orange-600">
                  - {p.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" /> Dívidas quitadas
            </CardTitle>
            <CardDescription>Ficam no histórico; os pagamentos antigos continuam nas análises</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {paidDebts.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma dívida quitada ainda.</p>}
            {paidDebts.map(d => (
              <div key={d.id} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.creditor}
                    {d.paidAt ? ` · quitada em ${new Date(d.paidAt).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-600">
                    {d.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => handleDeleteDebt(d)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmação de Quitação */}
      <AnimatePresence>
        {showPayOffModal && debtToPayOff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowPayOffModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Quitar Dívida</h3>
                      <p className="text-green-100 text-sm">Confirme a quitação total</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPayOffModal(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Debt Info */}
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Dívida selecionada</p>
                    <p className="text-xl font-bold">{debtToPayOff.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{debtToPayOff.creditor}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-xs text-muted-foreground mb-1">Valor a pagar</p>
                      <p className="text-lg font-bold text-red-600">
                        {debtToPayOff.remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-xs text-muted-foreground mb-1">Juros mensais</p>
                      <p className="text-lg font-bold text-orange-600">
                        {debtToPayOff.interestRate}% a.m.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulação de Impacto */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-lg">Impacto Financeiro</h4>
                  </div>

                  <div className="space-y-3">
                    {/* Liberação mensal */}
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Você liberará por mês</p>
                          <p className="text-2xl font-bold text-green-600">
                            + {debtToPayOff.monthlyPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                    </div>

                    {/* Novo saldo disponível */}
                    {(() => {
                      const simulation = simulateDebtPayoff(health, debtToPayOff.monthlyPayment);

                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm">Saldo atual mensal</span>
                            <span className={`font-bold ${health.isInDeficit ? 'text-red-600' : 'text-green-600'}`}>
                              {health.availableAfterDebts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border-2 border-primary">
                            <span className="text-sm font-semibold">Novo saldo mensal</span>
                            <span className={`font-bold text-lg ${simulation.willBePositive ? 'text-green-600' : 'text-orange-600'}`}>
                              {simulation.availableAfterDebts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                          
                          {simulation.leavesDeficit && (
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700">
                              <p className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Você sairá do vermelho! 🎉
                              </p>
                            </div>
                          )}

                          {!simulation.willBePositive && (
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-300 dark:border-orange-700">
                              <p className="text-xs text-orange-700 dark:text-orange-300">
                                Ainda faltarão {Math.abs(simulation.availableAfterDebts).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para equilibrar
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-muted rounded">
                              <p className="text-muted-foreground">Comprometimento</p>
                              <p className="font-semibold">
                                {health.debtCommitmentPercentage.toFixed(1)}% → {simulation.debtCommitmentPercentage.toFixed(1)}%
                              </p>
                            </div>
                            <div className="p-2 bg-muted rounded">
                              <p className="text-muted-foreground">Taxa de poupança</p>
                              <p className="font-semibold">
                                {health.realSavingsRate.toFixed(1)}% → {simulation.realSavingsRate.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowPayOffModal(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmPayOff}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Quitação
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
