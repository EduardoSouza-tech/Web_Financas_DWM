'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Edit, PiggyBank, Save, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MonthPicker } from '@/components/month-picker'
import { useFinance } from '@/contexts/FinanceContext'
import { formatCurrency, cn } from '@/lib/utils'
import { formatMonth } from '@/lib/finance/credit-card'

export default function BudgetsPage() {
  const { categories, updateCategory, referenceMonth, setReferenceMonth, getMonthSummary } = useFinance()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const summary = getMonthSummary(referenceMonth)
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const rows = expenseCategories.map(category => {
    const limit = category.budgetLimit ?? 0
    const spent = summary.byCategory[category.name] ?? 0
    const percentage = limit > 0 ? (spent / limit) * 100 : 0
    return { category, limit, spent, remaining: limit - spent, percentage }
  })
  const budgeted = rows.filter(r => r.limit > 0).sort((a, b) => b.percentage - a.percentage)
  const unbudgeted = rows.filter(r => r.limit <= 0)

  // Gastos em categorias que não existem mais na lista (ex.: nome antigo)
  const known = new Set(expenseCategories.map(c => c.name))
  const orphanSpent = Object.entries(summary.byCategory).filter(([name]) => !known.has(name))

  const totalLimit = budgeted.reduce((s, r) => s + r.limit, 0)
  const totalSpentBudgeted = budgeted.reduce((s, r) => s + r.spent, 0)
  const overCount = budgeted.filter(r => r.spent > r.limit).length
  const outsideBudget = summary.expenses - totalSpentBudgeted

  const startEdit = (id: string, limit: number) => {
    setEditingId(id)
    setEditValue(limit > 0 ? String(limit) : '')
  }

  const saveEdit = (id: string) => {
    const value = parseFloat(editValue)
    updateCategory(id, { budgetLimit: value > 0 ? value : undefined })
    setEditingId(null)
  }

  const statusOf = (percentage: number) =>
    percentage > 100 ? { label: 'Estourado', variant: 'danger' as const, bar: 'bg-red-500' }
    : percentage >= 80 ? { label: 'Atenção', variant: 'warning' as const, bar: 'bg-amber-500' }
    : { label: 'OK', variant: 'success' as const, bar: 'bg-green-500' }

  const limitEditor = (id: string) => (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min="0"
        step="10"
        autoFocus
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') saveEdit(id)
          if (e.key === 'Escape') setEditingId(null)
        }}
        className="h-8 w-28"
        placeholder="Sem limite"
      />
      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => saveEdit(id)} aria-label="Salvar">
        <Save className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingId(null)} aria-label="Cancelar">
        <X className="w-4 h-4" />
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orçamento</h1>
          <p className="text-muted-foreground mt-1">
            Limite mensal por categoria, comparado com o que foi gasto de verdade
          </p>
        </div>
        <MonthPicker value={referenceMonth} onChange={setReferenceMonth} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Orçado</p>
            <p className="text-2xl font-bold">{formatCurrency(totalLimit)}</p>
            <p className="text-xs text-muted-foreground">{budgeted.length} categorias com limite</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Gasto nas categorias orçadas</p>
            <p className={cn('text-2xl font-bold', totalSpentBudgeted > totalLimit ? 'text-red-500' : '')}>
              {formatCurrency(totalSpentBudgeted)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalLimit > 0 ? ((totalSpentBudgeted / totalLimit) * 100).toFixed(1) : '0.0'}% do orçado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Fora do orçamento</p>
            <p className="text-2xl font-bold">{formatCurrency(outsideBudget)}</p>
            <p className="text-xs text-muted-foreground">gastos em categorias sem limite</p>
          </CardContent>
        </Card>
        <Card className={overCount > 0 ? 'border-red-500/40' : ''}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Estourados</p>
            <p className={cn('text-2xl font-bold', overCount > 0 ? 'text-red-500' : 'text-green-600')}>{overCount}</p>
            <p className="text-xs text-muted-foreground">em {formatMonth(referenceMonth)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5" /> Categorias com limite
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Despesas à vista contam pela data; cartão e assinaturas no cartão, pela fatura do mês.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgeted.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria com limite. Defina abaixo.</p>
          )}
          {budgeted.map(({ category, limit, spent, remaining, percentage }) => {
            const status = statusOf(percentage)
            return (
              <div key={category.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-xl">{category.icon}</span>
                    {category.name}
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  {editingId === category.id ? (
                    limitEditor(category.id)
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <span>
                        <strong>{formatCurrency(spent)}</strong>
                        <span className="text-muted-foreground"> de {formatCurrency(limit)}</span>
                      </span>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(category.id, limit)} aria-label="Editar limite">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={cn('h-full', status.bar)} style={{ width: `${Math.min(100, percentage)}%` }} />
                </div>
                <p className={cn('text-xs flex items-center gap-1', remaining < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                  {remaining < 0 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  {remaining < 0
                    ? `Passou ${formatCurrency(-remaining)} do limite (${percentage.toFixed(0)}%)`
                    : `Restam ${formatCurrency(remaining)} (${percentage.toFixed(0)}% usado)`}
                </p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categorias sem limite</CardTitle>
          <p className="text-sm text-muted-foreground">
            Defina um limite para acompanhar. Os limites são os mesmos das Configurações e valem para todos os perfis.
          </p>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {unbudgeted.map(({ category, spent }) => (
            <div key={category.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
                <span className="text-sm text-muted-foreground">gasto {formatCurrency(spent)}</span>
              </div>
              {editingId === category.id ? (
                limitEditor(category.id)
              ) : (
                <Button size="sm" variant="outline" onClick={() => startEdit(category.id, 0)}>
                  Definir limite
                </Button>
              )}
            </div>
          ))}
          {orphanSpent.map(([name, amount]) => (
            <div key={name} className="flex items-center justify-between gap-2 py-3 text-sm">
              <span className="text-muted-foreground">
                {name} <span className="text-xs">(categoria não cadastrada)</span>
              </span>
              <span>{formatCurrency(amount)}</span>
            </div>
          ))}
          <div className="pt-3 text-sm">
            <Link href="/dashboard/settings" className="text-primary hover:underline">
              Criar ou renomear categorias
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
