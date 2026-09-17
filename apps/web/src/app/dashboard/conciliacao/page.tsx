'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { CheckCircle2, CircleDashed, CreditCard, Download, Lock, RotateCcw, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MonthPicker } from '@/components/month-picker'
import { useFinance } from '@/contexts/FinanceContext'
import { useProfiles } from '@/providers/profile-provider'
import { useConfirm } from '@/providers/confirm-provider'
import { formatCurrency, cn } from '@/lib/utils'
import {
  DEFAULT_CLOSING_DAY,
  formatDateBR,
  formatMonth,
  invoicePeriod,
  type Installment,
} from '@/lib/finance/credit-card'

const round2 = (n: number) => Math.round(n * 100) / 100

export default function ConciliacaoPage() {
  const confirm = useConfirm()
  const {
    cards,
    referenceMonth,
    setReferenceMonth,
    getInstallmentsForInvoice,
    getInvoice,
    toggleInstallmentChecked,
    setInvoiceStatementAmount,
    setInvoicePaid,
  } = useFinance()
  const { profiles, isFamilyView } = useProfiles()
  const [cardFilter, setCardFilter] = useState('all')

  const monthInstallments = getInstallmentsForInvoice(referenceMonth)

  // Uma fatura por cartão (e por perfil, na visão Família)
  const invoices = useMemo(
    () =>
      cards
        .filter(card => cardFilter === 'all' || card.id === cardFilter)
        .map(card => {
          const items = monthInstallments
            .filter(i => i.cardId === card.id && i.profile_id === card.profile_id)
            .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))
          const state = getInvoice(card.profile_id, card.id, referenceMonth)
          const total = round2(items.reduce((sum, i) => sum + i.amount, 0))
          const checkedItems = items.filter(i => state.checked.includes(i.key))
          const checkedTotal = round2(checkedItems.reduce((sum, i) => sum + i.amount, 0))
          const difference = state.statementAmount === undefined ? undefined : round2(state.statementAmount - total)
          return { card, items, state, total, checkedTotal, pending: items.length - checkedItems.length, difference }
        }),
    [cards, cardFilter, monthInstallments, getInvoice, referenceMonth]
  )

  const withItems = invoices.filter(inv => inv.items.length > 0)
  const grandTotal = round2(invoices.reduce((sum, inv) => sum + inv.total, 0))
  const grandChecked = round2(invoices.reduce((sum, inv) => sum + inv.checkedTotal, 0))
  const paidCount = withItems.filter(inv => inv.state.paidAt).length

  const profileName = (id?: string) => profiles.find(p => p.id === id)?.name

  const checkAll = (items: Installment[], checked: string[]) =>
    items.filter(i => !checked.includes(i.key)).forEach(i => toggleInstallmentChecked(i))

  const pay = async (inv: (typeof invoices)[number]) => {
    const warnings = []
    if (inv.pending > 0) warnings.push(`${inv.pending} parcela(s) ainda não conferida(s)`)
    if (inv.difference !== undefined && inv.difference !== 0)
      warnings.push(`diferença de ${formatCurrency(inv.difference)} em relação ao valor do banco`)
    if (
      warnings.length &&
      !(await confirm({
        title: 'Marcar fatura como paga?',
        message: `A fatura tem ${warnings.join(' e ')}.`,
        confirmLabel: 'Marcar como paga',
      }))
    )
      return
    setInvoicePaid(inv.card.profile_id, inv.card.id, referenceMonth, true)
  }

  const exportExcel = () => {
    const rows = withItems.flatMap(inv =>
      inv.items.map(i => ({
        Cartão: inv.card.name,
        ...(isFamilyView ? { Perfil: profileName(i.profile_id) ?? '' } : {}),
        'Data da compra': formatDateBR(i.purchaseDate),
        Descrição: i.description,
        Categoria: i.category,
        Parcela: `${i.number}/${i.total}`,
        Valor: i.amount,
        Conferida: inv.state.checked.includes(i.key) ? 'Sim' : 'Não',
        'Fatura paga': inv.state.paidAt ? 'Sim' : 'Não',
      }))
    )
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 20 }, ...(isFamilyView ? [{ wch: 14 }] : []), { wch: 14 }, { wch: 36 }, { wch: 16 }, { wch: 9 }, { wch: 12 }, { wch: 10 }, { wch: 11 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Fatura')
    XLSX.writeFile(wb, `conciliacao_${referenceMonth}.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conciliação de Cartões</h1>
          <p className="text-muted-foreground">
            Parcelas lançadas no cartão de crédito que caem na fatura do mês (mês do fechamento)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MonthPicker value={referenceMonth} onChange={setReferenceMonth} prefix="Fatura de" />
          <Button variant="outline" className="gap-2" onClick={exportExcel} disabled={withItems.length === 0}>
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total das faturas</p>
            <p className="text-2xl font-bold">{formatCurrency(grandTotal)}</p>
            <p className="text-xs text-muted-foreground">{monthInstallments.length} parcelas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Conferido</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(grandChecked)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">A conferir</p>
            <p className="text-2xl font-bold text-orange-500">{formatCurrency(round2(grandTotal - grandChecked))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Faturas pagas</p>
            <p className="text-2xl font-bold">
              {paidCount}/{withItems.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de cartão */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={cardFilter === 'all' ? 'default' : 'outline'} onClick={() => setCardFilter('all')}>
          Todos os cartões
        </Button>
        {cards.map(card => (
          <Button
            key={`${card.profile_id}|${card.id}`}
            size="sm"
            variant={cardFilter === card.id ? 'default' : 'outline'}
            onClick={() => setCardFilter(card.id)}
            className="gap-1"
          >
            <CreditCard className="w-4 h-4" />
            {card.name}
          </Button>
        ))}
      </div>

      {cards.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum cartão cadastrado. <Link href="/dashboard/cards" className="text-primary hover:underline">Cadastrar cartão</Link>
          </CardContent>
        </Card>
      )}

      {invoices.map(inv => {
        const { card, items, state } = inv
        const closingDay = card.closingDay ?? DEFAULT_CLOSING_DAY
        const period = invoicePeriod(referenceMonth, closingDay)
        const paid = !!state.paidAt
        const reconciled = items.length > 0 && inv.pending === 0 && (inv.difference === undefined || inv.difference === 0)

        return (
          <Card key={`${card.profile_id}|${card.id}`} className={cn(paid && 'border-green-500/40')}>
            <CardHeader className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {card.name}
                    {isFamilyView && profileName(card.profile_id) && (
                      <Badge variant="secondary">{profileName(card.profile_id)}</Badge>
                    )}
                    {paid ? (
                      <Badge variant="success">Paga</Badge>
                    ) : reconciled ? (
                      <Badge variant="info">Conferida</Badge>
                    ) : items.length > 0 ? (
                      <Badge variant="warning">Em conferência</Badge>
                    ) : null}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Compras de {formatDateBR(period.start)} a {formatDateBR(period.end)} · fecha dia {closingDay}
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-sm text-muted-foreground">Total no sistema</p>
                  <p className="text-2xl font-bold">{formatCurrency(inv.total)}</p>
                </div>
              </div>

              {items.length > 0 && (
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="md:w-56">
                    <label className="text-xs text-muted-foreground mb-1 block">Valor da fatura no banco</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      disabled={paid}
                      value={state.statementAmount ?? ''}
                      onChange={e =>
                        setInvoiceStatementAmount(
                          card.profile_id,
                          card.id,
                          referenceMonth,
                          e.target.value === '' ? undefined : parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                  {inv.difference !== undefined && (
                    <div
                      className={cn(
                        'flex items-center gap-2 text-sm font-medium h-10',
                        inv.difference === 0 ? 'text-green-600' : 'text-red-500'
                      )}
                    >
                      {inv.difference === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {inv.difference === 0
                        ? 'Bate com o banco'
                        : inv.difference > 0
                          ? `Banco cobra ${formatCurrency(inv.difference)} a mais: falta lançar algo?`
                          : `Sistema tem ${formatCurrency(-inv.difference)} a mais que o banco`}
                    </div>
                  )}
                  <div className="flex-1" />
                  <div className="flex flex-wrap gap-2">
                    {!paid && inv.pending > 0 && (
                      <Button variant="outline" size="sm" onClick={() => checkAll(items, state.checked)}>
                        Conferir todas ({inv.pending})
                      </Button>
                    )}
                    {paid ? (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setInvoicePaid(card.profile_id, card.id, referenceMonth, false)}>
                        <RotateCcw className="w-4 h-4" /> Reabrir fatura
                      </Button>
                    ) : (
                      <Button size="sm" className="gap-1" onClick={() => pay(inv)}>
                        <Lock className="w-4 h-4" /> Marcar fatura como paga
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma parcela nesta fatura.</p>
              ) : (
                <div className="divide-y divide-border rounded-lg border">
                  {items.map(item => {
                    const checked = state.checked.includes(item.key)
                    return (
                      <label
                        key={item.key}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 text-sm',
                          paid ? 'cursor-default' : 'cursor-pointer hover:bg-accent/50',
                          checked && 'bg-green-500/5'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 shrink-0"
                          checked={checked}
                          disabled={paid}
                          onChange={() => toggleInstallmentChecked(item)}
                        />
                        {checked ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 hidden sm:block" />
                        ) : (
                          <CircleDashed className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                        )}
                        <span className="w-20 shrink-0 text-muted-foreground">{formatDateBR(item.purchaseDate).slice(0, 5)}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block truncate font-medium">{item.description}</span>
                          <span className="block text-xs text-muted-foreground">
                            {item.category}
                            {isFamilyView && profileName(item.profile_id) ? ` · ${profileName(item.profile_id)}` : ''}
                          </span>
                        </span>
                        {item.total > 1 && (
                          <Badge variant="outline" className="shrink-0">
                            {item.number}/{item.total}
                          </Badge>
                        )}
                        <span className="w-24 shrink-0 text-right font-semibold">{formatCurrency(item.amount)}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {cards.length > 0 && monthInstallments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Nenhuma compra no cartão cai na fatura de {formatMonth(referenceMonth)}.{' '}
          <Link href="/dashboard/transactions" className="text-primary hover:underline">
            Lançar compra
          </Link>
        </p>
      )}
    </div>
  )
}
