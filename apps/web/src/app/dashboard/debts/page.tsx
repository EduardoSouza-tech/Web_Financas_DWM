'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingDown, DollarSign, Calendar, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

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

const mockDebts: Debt[] = [
  {
    id: '1',
    name: 'Financiamento do Carro',
    type: 'financing',
    totalAmount: 45000,
    remainingAmount: 28500,
    monthlyPayment: 1250,
    interestRate: 1.2,
    installmentsPaid: 18,
    totalInstallments: 48,
    nextDueDate: '2025-11-15',
    creditor: 'Banco Inter',
    color: 'from-blue-500 to-blue-700'
  },
  {
    id: '2',
    name: 'Empréstimo Pessoal',
    type: 'loan',
    totalAmount: 15000,
    remainingAmount: 8500,
    monthlyPayment: 650,
    interestRate: 2.5,
    installmentsPaid: 10,
    totalInstallments: 24,
    nextDueDate: '2025-11-20',
    creditor: 'Nubank',
    color: 'from-purple-500 to-purple-700'
  },
  {
    id: '3',
    name: 'Cartão de Crédito Parcelado',
    type: 'credit',
    totalAmount: 3200,
    remainingAmount: 1600,
    monthlyPayment: 400,
    interestRate: 3.8,
    installmentsPaid: 4,
    totalInstallments: 8,
    nextDueDate: '2025-11-10',
    creditor: 'C6 Bank',
    color: 'from-orange-500 to-orange-700'
  }
];

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>(mockDebts);
  const [paidMessage, setPaidMessage] = useState<string | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [installmentsToAdvance, setInstallmentsToAdvance] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [debtForm, setDebtForm] = useState({
    name: '',
    type: 'loan' as 'loan' | 'financing' | 'credit' | 'other',
    totalAmount: '',
    interestRate: '',
    totalInstallments: '',
    creditor: ''
  });

  const handlePayOffDebt = (debtId: string) => {
    const debt = debts.find(d => d.id === debtId);
    if (debt) {
      setPaidMessage(`✅ Dívida "${debt.name}" quitada totalmente! (${debt.remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`);
      
      // Remove a dívida após 300ms (tempo da animação)
      setTimeout(() => {
        setDebts(debts.filter(d => d.id !== debtId));
      }, 300);

      // Remove a mensagem após 5 segundos
      setTimeout(() => {
        setPaidMessage(null);
      }, 5000);
    }
  };

  const handleAdvanceInstallments = () => {
    if (!selectedDebt) return;

    const remainingInstallments = selectedDebt.totalInstallments - selectedDebt.installmentsPaid;
    const actualInstallments = Math.min(installmentsToAdvance, remainingInstallments);
    const amountPaid = actualInstallments * selectedDebt.monthlyPayment;
    const newRemainingAmount = selectedDebt.remainingAmount - amountPaid;
    const newInstallmentsPaid = selectedDebt.installmentsPaid + actualInstallments;

    if (newRemainingAmount <= 0 || newInstallmentsPaid >= selectedDebt.totalInstallments) {
      // Quitou totalmente
      setPaidMessage(`✅ Você adiantou ${actualInstallments} parcela(s) de "${selectedDebt.name}" e QUITOU a dívida! 🎉`);
      setTimeout(() => {
        setDebts(debts.filter(d => d.id !== selectedDebt.id));
      }, 300);
    } else {
      // Adianto parcial
      setPaidMessage(`✅ Você adiantou ${actualInstallments} parcela(s) de "${selectedDebt.name}" (${amountPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`);
      setDebts(debts.map(d => 
        d.id === selectedDebt.id 
          ? { 
              ...d, 
              remainingAmount: newRemainingAmount,
              installmentsPaid: newInstallmentsPaid
            }
          : d
      ));
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
    if (!debtForm.name || !debtForm.totalAmount || !debtForm.totalInstallments) return;

    const totalAmount = parseFloat(debtForm.totalAmount);
    const totalInstallments = parseInt(debtForm.totalInstallments);
    const interestRate = parseFloat(debtForm.interestRate) || 0;
    
    // Cálculo do valor mensal com juros (fórmula Price simplificada)
    const monthlyInterest = interestRate / 100;
    const monthlyPayment = totalInstallments > 0 
      ? totalAmount * (monthlyInterest * Math.pow(1 + monthlyInterest, totalInstallments)) / 
        (Math.pow(1 + monthlyInterest, totalInstallments) - 1)
      : totalAmount;

    const today = new Date();
    const nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);

    const colors = ['from-blue-500 to-blue-700', 'from-purple-500 to-purple-700', 'from-orange-500 to-orange-700', 'from-green-500 to-green-700'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newDebt: Debt = {
      id: `debt-${Date.now()}`,
      name: debtForm.name,
      type: debtForm.type,
      totalAmount,
      remainingAmount: totalAmount,
      monthlyPayment: isNaN(monthlyPayment) ? totalAmount / totalInstallments : monthlyPayment,
      interestRate,
      installmentsPaid: 0,
      totalInstallments,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      creditor: debtForm.creditor || 'Não informado',
      color: randomColor
    };

    setDebts([...debts, newDebt]);
    setDebtForm({ name: '', type: 'loan', totalAmount: '', interestRate: '', totalInstallments: '', creditor: '' });
    setShowAddModal(false);
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const totalMonthly = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
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
                  <label className="text-sm font-medium mb-2 block">Valor Total</label>
                  <Input
                    type="number"
                    placeholder="R$ 15.000,00"
                    value={debtForm.totalAmount}
                    onChange={(e) => setDebtForm({ ...debtForm, totalAmount: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Taxa de Juros (%)</label>
                    <Input
                      type="number"
                      placeholder="2.5"
                      value={debtForm.interestRate}
                      onChange={(e) => setDebtForm({ ...debtForm, interestRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Total de Parcelas</label>
                    <Input
                      type="number"
                      placeholder="24"
                      value={debtForm.totalInstallments}
                      onChange={(e) => setDebtForm({ ...debtForm, totalInstallments: e.target.value })}
                    />
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

                {debtForm.totalAmount && debtForm.totalInstallments && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Parcela Mensal Estimada:</p>
                    <p className="text-xl font-bold">
                      {(parseFloat(debtForm.totalAmount) / parseInt(debtForm.totalInstallments)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleAddDebt} className="flex-1">
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
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
