'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  Wallet,
  Trash2,
  FileText,
  Calendar,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import TransactionForm from '@/components/forms/transaction-form'
import { useConfirm } from '@/providers/confirm-provider'
import { MonthPicker } from '@/components/month-picker'
import { useFinance, isCardTransaction, type Transaction } from '@/contexts/FinanceContext'
import { formatDateBR, formatMonth, monthOfDate, splitAmount } from '@/lib/finance/credit-card'

type TypeFilter = 'all' | 'income' | 'expense'
type PaymentFilter = 'all' | 'cash' | 'credit_card'

export default function TransactionsPage() {
  const confirm = useConfirm()
  const {
    transactions,
    categories,
    cards,
    referenceMonth,
    setReferenceMonth,
    deleteTransaction,
    getTotalIncome,
    getTotalExpenses,
    getInstallmentsForInvoice,
  } = useFinance()

  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<TypeFilter>('all')
  const [filterPayment, setFilterPayment] = useState<PaymentFilter>('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const iconOf = (name: string) => categories.find(c => c.name === name)?.icon ?? '📁'
  const cardName = (id?: string) => cards.find(c => c.id === id)?.name ?? 'Cartão removido'

  // Lançamentos do mês pela data (compras no cartão aparecem na data da compra)
  const monthTransactions = useMemo(
    () =>
      (transactions as Transaction[])
        .filter(tx => monthOfDate(tx.date) === referenceMonth)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, referenceMonth]
  )

  const filtered = monthTransactions.filter(tx => {
    if (filterType !== 'all' && tx.type !== filterType) return false
    if (filterPayment !== 'all' && (isCardTransaction(tx) ? 'credit_card' : 'cash') !== filterPayment) return false
    if (filterCategory !== 'all' && tx.category !== filterCategory) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        tx.description.toLowerCase().includes(term) ||
        tx.category.toLowerCase().includes(term) ||
        (tx.tags ?? []).some(tag => tag.toLowerCase().includes(term))
      )
    }
    return true
  })

  const income = getTotalIncome()
  const expenses = getTotalExpenses()
  const invoiceInstallments = getInstallmentsForInvoice(referenceMonth)
  const invoiceTotal = invoiceInstallments.reduce((sum, i) => sum + i.amount, 0)
  const usedCategories = Array.from(new Set(monthTransactions.map(tx => tx.category))).sort()

  const handleDelete = async (tx: Transaction) => {
    const parcelas = isCardTransaction(tx) && (tx.installments ?? 1) > 1
    const ok = await confirm({
      title: `Excluir "${tx.description}"?`,
      message: parcelas ? `Todas as ${tx.installments} parcelas serão removidas das faturas.` : 'Esta ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      destructive: true,
    })
    if (ok) deleteTransaction(tx.id)
  }

  const filterButton = (active: boolean) => (active ? 'default' : 'outline') as 'default' | 'outline'

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-muted-foreground mt-1">Gerencie todas as suas movimentações financeiras</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MonthPicker value={referenceMonth} onChange={setReferenceMonth} />
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Receitas do mês</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(income)}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Despesas do mês</p>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(expenses)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              inclui {formatCurrency(invoiceTotal)} da fatura de {formatMonth(referenceMonth, true)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Saldo do mês</p>
            <p className={`text-2xl font-bold ${income - expenses >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(income - expenses)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">sem as parcelas de dívidas</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Lançamentos no mês</p>
            <p className="text-2xl font-bold">{monthTransactions.length}</p>
            <Link href="/dashboard/conciliacao" className="text-xs text-primary hover:underline">
              {invoiceInstallments.length} parcelas na fatura → conciliar
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardContent className="pt-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, categoria ou tags..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={filterButton(filterType === 'all')} onClick={() => setFilterType('all')}>Todas</Button>
            <Button size="sm" variant={filterButton(filterType === 'income')} onClick={() => setFilterType('income')} className="gap-1">
              <ArrowUpCircle className="w-4 h-4" /> Receitas
            </Button>
            <Button size="sm" variant={filterButton(filterType === 'expense')} onClick={() => setFilterType('expense')} className="gap-1">
              <ArrowDownCircle className="w-4 h-4" /> Despesas
            </Button>
            <span className="mx-1 w-px bg-border" />
            <Button size="sm" variant={filterButton(filterPayment === 'all')} onClick={() => setFilterPayment('all')}>Qualquer pagamento</Button>
            <Button size="sm" variant={filterButton(filterPayment === 'cash')} onClick={() => setFilterPayment('cash')} className="gap-1">
              <Wallet className="w-4 h-4" /> À vista
            </Button>
            <Button size="sm" variant={filterButton(filterPayment === 'credit_card')} onClick={() => setFilterPayment('credit_card')} className="gap-1">
              <CreditCard className="w-4 h-4" /> Cartão
            </Button>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="h-9 px-3 bg-background border rounded-lg text-sm"
            >
              <option value="all">Todas as categorias</option>
              {usedCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Movimentações de {formatMonth(referenceMonth)}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Compras no cartão aparecem na data da compra; nas análises, contam parcela a parcela no mês da fatura.
          </p>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação neste mês</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(tx => {
                const card = isCardTransaction(tx)
                const count = tx.installments ?? 1
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-xl ${
                          tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}
                      >
                        {iconOf(tx.category)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tx.description}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <span>{tx.category}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {card ? <CreditCard className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                            {card ? cardName(tx.cardId) : 'À vista'}
                          </span>
                          {card && count > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {(tx.firstInstallment ?? 1) > 1 ? `da ${tx.firstInstallment}ª ` : ''}
                              {count}x de {formatCurrency(splitAmount(tx.amount, count)[0])}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1 lg:hidden">
                            <Calendar className="w-3 h-3" /> {formatDateBR(tx.date)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground min-w-[100px]">
                      <Calendar className="w-4 h-4" />
                      {formatDateBR(tx.date)}
                    </div>

                    <div className="flex items-center gap-2">
                      <p className={`text-lg font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                        onClick={() => handleDelete(tx)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showAddModal && <TransactionForm onClose={() => setShowAddModal(false)} />}
    </div>
  )
}
