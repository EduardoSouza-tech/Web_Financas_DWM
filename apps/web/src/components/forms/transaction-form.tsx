'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Tag as TagIcon, Calendar as CalendarIcon, CreditCard, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useFinance, type Transaction } from '@/contexts/FinanceContext'
import {
  DEFAULT_CLOSING_DAY,
  addMonths,
  currentMonthKey,
  formatMonth,
  invoiceMonthOf,
  invoicePeriod,
  splitAmount,
} from '@/lib/finance/credit-card'
import { formatCurrency } from '@/lib/utils'

interface TransactionFormProps {
  onClose: () => void
  type?: 'income' | 'expense'
}

const optionClass = (active: boolean) =>
  `p-3 rounded-lg border-2 transition-all text-left disabled:opacity-50 ${
    active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
  }`

export default function TransactionForm({ onClose, type = 'expense' }: TransactionFormProps) {
  const { categories, cards, addTransaction } = useFinance()

  const [formData, setFormData] = useState({
    type: type as 'income' | 'expense',
    amount: '',
    description: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    tags: [] as string[],
    paymentMethod: 'cash' as 'cash' | 'credit_card',
    cardId: cards[0]?.id ?? '',
    installments: '1',
    // Compra já parcelada (em andamento)
    ongoing: false,
    currentInstallment: '2',
    currentInvoiceMonth: currentMonthKey(),
  })
  const [currentTag, setCurrentTag] = useState('')

  const set = (patch: Partial<typeof formData>) => setFormData(prev => ({ ...prev, ...patch }))

  const filteredCategories = categories.filter(c => c.type === formData.type)
  const isCard = formData.type === 'expense' && formData.paymentMethod === 'credit_card'
  const card = cards.find(c => c.id === formData.cardId)
  const closingDay = card?.closingDay ?? DEFAULT_CLOSING_DAY

  const installmentsCount = Math.max(1, parseInt(formData.installments) || 1)
  const currentInstallment = Math.min(Math.max(1, parseInt(formData.currentInstallment) || 1), installmentsCount)
  const value = parseFloat(formData.amount) || 0
  // Compra nova: valor TOTAL. Compra em andamento: valor da PARCELA.
  const totalAmount = isCard && formData.ongoing ? Math.round(value * installmentsCount * 100) / 100 : value

  // Fatura onde cai a primeira parcela lançada e a parcela 1
  const plan = useMemo(() => {
    if (!isCard) return null
    const firstInvoiceMonth = formData.ongoing
      ? addMonths(formData.currentInvoiceMonth, -(currentInstallment - 1))
      : invoiceMonthOf(formData.date, closingDay)
    const firstShown = formData.ongoing ? currentInstallment : 1
    const shownMonth = addMonths(firstInvoiceMonth, firstShown - 1)
    const lastMonth = addMonths(firstInvoiceMonth, installmentsCount - 1)
    const perInstallment = totalAmount > 0 ? splitAmount(totalAmount, installmentsCount)[0] : 0
    return { firstInvoiceMonth, firstShown, shownMonth, lastMonth, perInstallment, period: invoicePeriod(shownMonth, closingDay) }
  }, [isCard, formData.ongoing, formData.currentInvoiceMonth, formData.date, currentInstallment, installmentsCount, closingDay, totalAmount])

  const canSubmit =
    value > 0 &&
    !!formData.description &&
    !!formData.categoryId &&
    (!isCard || (!!card && installmentsCount >= 1 && (!formData.ongoing || installmentsCount >= 2)))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const category = categories.find(c => c.id === formData.categoryId)

    const tx: Omit<Transaction, 'id' | 'profile_id'> = {
      type: formData.type,
      amount: totalAmount,
      description: formData.description,
      category: category?.name ?? '',
      date: formData.date,
      tags: formData.tags,
      paymentMethod: isCard ? 'credit_card' : 'cash',
    }
    if (isCard && plan) {
      tx.cardId = formData.cardId
      tx.installments = installmentsCount
      tx.firstInstallment = plan.firstShown
      tx.firstInvoiceMonth = plan.firstInvoiceMonth
    }

    addTransaction(tx)
    onClose()
  }

  const addTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      set({ tags: [...formData.tags, currentTag] })
      setCurrentTag('')
    }
  }

  // Opções de fatura para compra em andamento: 3 meses atrás até 3 à frente
  const invoiceOptions = Array.from({ length: 7 }, (_, i) => addMonths(currentMonthKey(), i - 3))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-background rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto glass border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Nova Transação</h2>
            <p className="text-sm text-muted-foreground mt-1">Adicione uma nova movimentação financeira</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo */}
          <div>
            <label className="text-sm font-medium mb-3 block">Tipo de Transação</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`p-4 rounded-lg border-2 transition-all ${formData.type === 'income' ? 'border-green-500 bg-green-500/10' : 'border-border hover:border-green-500/50'}`}
                onClick={() => set({ type: 'income', categoryId: '', paymentMethod: 'cash' })}
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="font-medium text-sm">Receita</div>
              </button>
              <button
                type="button"
                className={`p-4 rounded-lg border-2 transition-all ${formData.type === 'expense' ? 'border-red-500 bg-red-500/10' : 'border-border hover:border-red-500/50'}`}
                onClick={() => set({ type: 'expense', categoryId: '' })}
              >
                <div className="text-2xl mb-2">📉</div>
                <div className="font-medium text-sm">Despesa</div>
              </button>
            </div>
          </div>

          {/* Forma de pagamento */}
          {formData.type === 'expense' && (
            <div>
              <label className="text-sm font-medium mb-3 block">Forma de pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={optionClass(formData.paymentMethod === 'cash')} onClick={() => set({ paymentMethod: 'cash' })}>
                  <Wallet className="w-5 h-5 mb-1" />
                  <div className="font-medium text-sm">Dinheiro / Débito / Pix</div>
                </button>
                <button
                  type="button"
                  className={optionClass(formData.paymentMethod === 'credit_card')}
                  onClick={() => set({ paymentMethod: 'credit_card' })}
                  disabled={cards.length === 0}
                >
                  <CreditCard className="w-5 h-5 mb-1" />
                  <div className="font-medium text-sm">Cartão de crédito</div>
                  {cards.length === 0 && <div className="text-xs text-muted-foreground">Cadastre um cartão primeiro</div>}
                </button>
              </div>
            </div>
          )}

          {/* Cartão e parcelas */}
          {isCard && (
            <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cartão</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {cards.map(c => (
                    <button key={c.id} type="button" className={optionClass(formData.cardId === c.id)} onClick={() => set({ cardId: c.id })}>
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground">Fecha dia {c.closingDay ?? DEFAULT_CLOSING_DAY}</div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={formData.ongoing}
                  onChange={e => set({ ongoing: e.target.checked, installments: e.target.checked && installmentsCount < 2 ? '10' : formData.installments })}
                />
                Compra já parcelada (em andamento)
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Total de parcelas</label>
                  <Input type="number" min={formData.ongoing ? 2 : 1} max={48} value={formData.installments} onChange={e => set({ installments: e.target.value })} />
                </div>
                {formData.ongoing ? (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Parcela atual</label>
                    <Input type="number" min={1} max={installmentsCount} value={formData.currentInstallment} onChange={e => set({ currentInstallment: e.target.value })} />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Valor por parcela</label>
                    <Input type="text" disabled value={plan ? formatCurrency(plan.perInstallment) : ''} className="bg-muted" />
                  </div>
                )}
              </div>

              {formData.ongoing && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fatura em que está a parcela atual</label>
                  <select
                    value={formData.currentInvoiceMonth}
                    onChange={e => set({ currentInvoiceMonth: e.target.value })}
                    className="w-full h-10 px-3 bg-background border rounded-md"
                  >
                    {invoiceOptions.map(m => (
                      <option key={m} value={m}>Fatura de {formatMonth(m)}</option>
                    ))}
                  </select>
                </div>
              )}

              {plan && value > 0 && (
                <div className="text-sm rounded-md bg-primary/10 border border-primary/30 p-3">
                  {formData.ongoing ? (
                    <>
                      Lança da parcela <strong>{plan.firstShown}/{installmentsCount}</strong> até{' '}
                      <strong>{installmentsCount}/{installmentsCount}</strong>, {formatCurrency(plan.perInstallment)} cada,
                      de <strong>{formatMonth(plan.shownMonth, true)}</strong> a <strong>{formatMonth(plan.lastMonth, true)}</strong>.
                      As parcelas anteriores não são lançadas.
                    </>
                  ) : (
                    <>
                      {installmentsCount}x de <strong>{formatCurrency(plan.perInstallment)}</strong>. A 1ª parcela cai na fatura de{' '}
                      <strong>{formatMonth(plan.shownMonth)}</strong> (compras de {plan.period.start.slice(8)}/{plan.period.start.slice(5, 7)} a{' '}
                      {plan.period.end.slice(8)}/{plan.period.end.slice(5, 7)})
                      {installmentsCount > 1 && <> e a última em <strong>{formatMonth(plan.lastMonth, true)}</strong></>}.
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Valor e data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {isCard ? (formData.ongoing ? 'Valor da parcela (R$)' : 'Valor total da compra (R$)') : 'Valor (R$)'}
              </label>
              <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={formData.amount} onChange={e => set({ amount: e.target.value })} required className="text-lg" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">{isCard ? 'Data da compra' : 'Data'}</label>
              <div className="relative">
                <Input type="date" value={formData.date} onChange={e => set({ date: e.target.value })} required />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <Input type="text" placeholder="Ex: Compra no supermercado" value={formData.description} onChange={e => set({ description: e.target.value })} required />
          </div>

          {/* Categoria */}
          <div>
            <label className="text-sm font-medium mb-3 block">Categoria</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {filteredCategories.map(category => (
                <button key={category.id} type="button" className={optionClass(formData.categoryId === category.id)} onClick={() => set({ categoryId: category.id })}>
                  <div className="text-xl mb-1">{category.icon}</div>
                  <div className="font-medium text-xs">{category.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tags (opcional)</label>
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                placeholder="Adicionar tag..."
                value={currentTag}
                onChange={e => setCurrentTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                <TagIcon className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => set({ tags: formData.tags.filter(t => t !== tag) })}>
                    {tag}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!canSubmit}>
              Adicionar Transação
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
