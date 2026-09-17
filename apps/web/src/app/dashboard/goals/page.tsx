'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Edit,
  Trash2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import GoalForm from '@/components/forms/goal-form'
import { useFinance } from '@/contexts/FinanceContext'
import {
  goalContributionsInMonth,
  goalCurrentAmount,
  goalMonthlyNeeded,
  goalPercentage,
  todayISO,
  type Goal,
} from '@/lib/finance/engine'
import { formatDateBR, formatMonth } from '@/lib/finance/credit-card'

export default function GoalsPage() {
  const { goals, saveGoal, setGoalStatus, deleteGoal, addGoalContribution, referenceMonth, getHealth } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [contributing, setContributing] = useState<Goal | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionDate, setContributionDate] = useState(todayISO())

  const totalSaved = goals.reduce((sum, g) => sum + goalCurrentAmount(g), 0)
  const totalTargeted = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => goalPercentage(g) >= 100).length
  const contributedThisMonth = goals.reduce((sum, g) => sum + goalContributionsInMonth(g, referenceMonth), 0)
  const neededThisMonth = activeGoals.reduce((sum, g) => sum + goalMonthlyNeeded(g), 0)
  const freeAfterDebts = getHealth().availableAfterDebts

  // O formulário trabalha com "valor atual"; a meta guarda valor inicial + aportes
  const handleSubmit = (data: any) => {
    const contributionsTotal = editing ? editing.contributions.reduce((s, c) => s + c.amount, 0) : 0
    saveGoal({
      id: editing?.id,
      name: data.name,
      icon: data.icon,
      type: data.type,
      targetAmount: data.targetAmount,
      initialAmount: (data.currentAmount || 0) - contributionsTotal,
      deadline: data.deadline,
      monthlyContribution: data.monthlyContribution || 0,
      autoContribute: data.autoContribute,
    })
    setEditing(null)
    setShowForm(false)
  }

  const confirmContribution = () => {
    const amount = parseFloat(contributionAmount)
    if (!contributing || !(amount > 0)) return
    addGoalContribution(contributing.id, amount, contributionDate)
    setContributing(null)
    setContributionAmount('')
  }

  const handleDelete = (goal: Goal) => {
    if (confirm(`Excluir a meta "${goal.name}"? O histórico de aportes também será apagado.`)) deleteGoal(goal.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Metas & Reservas</h1>
          <p className="text-muted-foreground mt-1">Planeje e acompanhe seus objetivos financeiros</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true) }} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Meta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="pt-6 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total guardado</p>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-500">{formatCurrency(totalSaved)}</p>
            <p className="text-xs text-muted-foreground">
              {totalTargeted > 0 ? ((totalSaved / totalTargeted) * 100).toFixed(1) : '0.0'}% do objetivo total
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Aportes em {formatMonth(referenceMonth, true)}</p>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(contributedThisMonth)}</p>
            <p className="text-xs text-muted-foreground">sai do dinheiro livre do mês</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Necessário por mês</p>
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className={`text-3xl font-bold ${neededThisMonth > freeAfterDebts ? 'text-orange-500' : ''}`}>
              {formatCurrency(neededThisMonth)}
            </p>
            <p className="text-xs text-muted-foreground">
              para cumprir os prazos · sobra {formatCurrency(freeAfterDebts)} no mês
            </p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Concluídas</p>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold">{completedGoals}</p>
            <p className="text-xs text-muted-foreground">{activeGoals.length} ativas de {goals.length}</p>
          </CardContent>
        </Card>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            Nenhuma meta cadastrada neste perfil.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => {
            const current = goalCurrentAmount(goal)
            const percentage = goalPercentage(goal)
            const isCompleted = percentage >= 100
            const needed = goalMonthlyNeeded(goal)
            const daysUntilDeadline = Math.ceil((new Date(`${goal.deadline}T12:00:00`).getTime() - Date.now()) / 86400000)
            const behind = !isCompleted && goal.status === 'active' && goal.monthlyContribution < needed
            const lastContributions = [...goal.contributions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

            return (
              <motion.div key={goal.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className={`glass h-full ${isCompleted ? 'border-green-500/40' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl">{goal.icon}</span>
                        <div className="min-w-0">
                          <CardTitle className="text-lg truncate">{goal.name}</CardTitle>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {isCompleted ? (
                              <Badge variant="success">Concluída</Badge>
                            ) : goal.status === 'paused' ? (
                              <Badge variant="secondary">Pausada</Badge>
                            ) : behind ? (
                              <Badge variant="warning">Atrasada</Badge>
                            ) : (
                              <Badge variant="info">No ritmo</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {!isCompleted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setGoalStatus(goal.id, goal.status === 'active' ? 'paused' : 'active')}
                          aria-label={goal.status === 'active' ? 'Pausar' : 'Retomar'}
                        >
                          {goal.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">{formatCurrency(current)}</span>
                        <span className="text-muted-foreground">de {formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-purple-600'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}%</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Planejado/mês</p>
                        <p className="font-semibold">{formatCurrency(goal.monthlyContribution)}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Necessário/mês</p>
                        <p className={`font-semibold ${behind ? 'text-orange-500' : ''}`}>{formatCurrency(needed)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Prazo {formatDateBR(goal.deadline)}
                      {!isCompleted && daysUntilDeadline < 0 && (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="w-3 h-3" /> vencido
                        </span>
                      )}
                    </div>

                    {lastContributions.length > 0 && (
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">Últimos aportes</p>
                        {lastContributions.map(c => (
                          <div key={c.id} className="flex justify-between">
                            <span>{formatDateBR(c.date)}</span>
                            <span className="font-medium text-green-600">+ {formatCurrency(c.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      {!isCompleted && goal.status === 'active' && (
                        <Button className="w-full gap-2" onClick={() => { setContributing(goal); setContributionDate(todayISO()) }}>
                          <Plus className="w-4 h-4" />
                          Adicionar Aporte
                        </Button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => { setEditing(goal); setShowForm(true) }}>
                          <Edit className="w-3 h-3" /> Editar
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700" onClick={() => handleDelete(goal)}>
                          <Trash2 className="w-3 h-3" /> Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {showForm && (
        <GoalForm
          goal={editing ? { ...editing, currentAmount: goalCurrentAmount(editing) } : null}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSubmit={handleSubmit}
        />
      )}

      {contributing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setContributing(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background border rounded-xl p-6 max-w-md w-full space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h3 className="text-xl font-bold">Adicionar aporte</h3>
              <p className="text-sm text-muted-foreground">
                {contributing.icon} {contributing.name} · atual {formatCurrency(goalCurrentAmount(contributing))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
                <Input type="number" step="0.01" min="0.01" autoFocus value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data</label>
                <Input type="date" value={contributionDate} onChange={e => setContributionDate(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              O aporte não é despesa, mas sai do dinheiro livre do mês no Overview.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setContributing(null)}>Cancelar</Button>
              <Button onClick={confirmContribution} disabled={!(parseFloat(contributionAmount) > 0)}>Confirmar aporte</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
