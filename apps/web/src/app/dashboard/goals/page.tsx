'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import GoalForm from '@/components/forms/goal-form'

interface Goal {
  goalId: string
  name: string
  icon: string
  targetAmount: number
  currentAmount: number
  percentage: number
  deadline: string
  monthlyContribution: number
  autoContribute: boolean
  status: 'active' | 'paused' | 'completed'
  type: 'emergency' | 'purchase' | 'vacation' | 'investment' | 'other'
  createdAt: string
  projectedCompletion: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')

  // Mock data
  useEffect(() => {
    const mockGoals: Goal[] = [
      {
        goalId: '1',
        name: 'Fundo de Emergência',
        icon: '🛡️',
        targetAmount: 30000,
        currentAmount: 15000,
        percentage: 50,
        deadline: '2026-06-01',
        monthlyContribution: 2000,
        autoContribute: true,
        status: 'active',
        type: 'emergency',
        createdAt: '2025-01-01',
        projectedCompletion: '2026-02-01'
      },
      {
        goalId: '2',
        name: 'Viagem para Europa',
        icon: '✈️',
        targetAmount: 15000,
        currentAmount: 8500,
        percentage: 56.7,
        deadline: '2026-07-01',
        monthlyContribution: 800,
        autoContribute: true,
        status: 'active',
        type: 'vacation',
        createdAt: '2025-03-15',
        projectedCompletion: '2026-06-15'
      },
      {
        goalId: '3',
        name: 'Notebook Novo',
        icon: '💻',
        targetAmount: 8000,
        currentAmount: 6200,
        percentage: 77.5,
        deadline: '2025-12-31',
        monthlyContribution: 600,
        autoContribute: false,
        status: 'active',
        type: 'purchase',
        createdAt: '2025-06-01',
        projectedCompletion: '2025-11-30'
      },
      {
        goalId: '4',
        name: 'Reserva para IPVA 2026',
        icon: '🚗',
        targetAmount: 2500,
        currentAmount: 1250,
        percentage: 50,
        deadline: '2026-01-31',
        monthlyContribution: 250,
        autoContribute: true,
        status: 'active',
        type: 'other',
        createdAt: '2025-07-01',
        projectedCompletion: '2025-12-31'
      },
      {
        goalId: '5',
        name: 'Investimento em Ações',
        icon: '📈',
        targetAmount: 50000,
        currentAmount: 12000,
        percentage: 24,
        deadline: '2027-12-31',
        monthlyContribution: 1500,
        autoContribute: true,
        status: 'active',
        type: 'investment',
        createdAt: '2025-01-15',
        projectedCompletion: '2027-06-30'
      },
      {
        goalId: '6',
        name: 'Curso de Especialização',
        icon: '📚',
        targetAmount: 5000,
        currentAmount: 4800,
        percentage: 96,
        deadline: '2025-11-30',
        monthlyContribution: 0,
        autoContribute: false,
        status: 'paused',
        type: 'other',
        createdAt: '2025-04-01',
        projectedCompletion: '2025-11-15'
      }
    ]

    setTimeout(() => {
      setGoals(mockGoals)
      setLoading(false)
    }, 500)
  }, [])

  const totalTargeted = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalRemaining = totalTargeted - totalSaved
  const activeGoals = goals.filter(g => g.status === 'active').length
  const completedGoals = goals.filter(g => g.percentage >= 100).length

  const handleContribute = (goal: Goal) => {
    setSelectedGoal(goal)
    setShowContributeModal(true)
  }

  const handleConfirmContribution = () => {
    if (selectedGoal && contributionAmount) {
      const amount = parseFloat(contributionAmount)
      setGoals(prev => prev.map(g => 
        g.goalId === selectedGoal.goalId 
          ? {
              ...g,
              currentAmount: g.currentAmount + amount,
              percentage: ((g.currentAmount + amount) / g.targetAmount) * 100
            }
          : g
      ))
      setContributionAmount('')
      setShowContributeModal(false)
      setSelectedGoal(null)
    }
  }

  const toggleGoalStatus = (goalId: string) => {
    setGoals(prev => prev.map(g => 
      g.goalId === goalId 
        ? { ...g, status: g.status === 'active' ? 'paused' : 'active' }
        : g
    ))
  }

  const handleAddGoal = (goal: any) => {
    const newGoal: Goal = {
      goalId: `goal-${Date.now()}`,
      ...goal,
      status: 'active' as const,
    }
    setGoals(prev => [newGoal, ...prev])
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Metas & Reservas</h1>
          <p className="text-muted-foreground mt-1">
            Planeje e acompanhe seus objetivos financeiros
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Meta
        </Button>
      </div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Economizado</p>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-500">
                  {formatCurrency(totalSaved)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {((totalSaved / totalTargeted) * 100).toFixed(1)}% do objetivo total
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Meta Total</p>
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold">
                  {formatCurrency(totalTargeted)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Faltam {formatCurrency(totalRemaining)}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Metas Ativas</p>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold">{activeGoals}</p>
                <p className="text-xs text-muted-foreground">
                  {goals.length} metas no total
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold">{completedGoals}</p>
                <p className="text-xs text-muted-foreground">
                  {completedGoals > 0 ? 'Parabéns!' : 'Continue economizando'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Goals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {goals.map((goal) => {
            const daysUntilDeadline = Math.ceil(
              (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
            const isNearDeadline = daysUntilDeadline < 30 && daysUntilDeadline > 0
            const isPastDeadline = daysUntilDeadline < 0
            const isCompleted = goal.percentage >= 100

            return (
              <motion.div key={goal.goalId} variants={itemVariants}>
                <Card className={`glass h-full border-2 transition-all hover:scale-105 ${
                  isCompleted ? 'border-green-500/50' :
                  goal.status === 'paused' ? 'border-gray-500/50' :
                  'border-transparent'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                          isCompleted ? 'bg-green-500/20' :
                          goal.status === 'paused' ? 'bg-gray-500/20' :
                          'bg-primary/20'
                        }`}>
                          {goal.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          <Badge 
                            variant={
                              goal.status === 'paused' ? 'default' :
                              goal.type === 'emergency' ? 'danger' :
                              goal.type === 'investment' ? 'success' :
                              goal.type === 'vacation' ? 'info' :
                              'warning'
                            }
                            className="mt-1"
                          >
                            {goal.type === 'emergency' ? 'Emergência' :
                             goal.type === 'purchase' ? 'Compra' :
                             goal.type === 'vacation' ? 'Viagem' :
                             goal.type === 'investment' ? 'Investimento' :
                             'Outro'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleGoalStatus(goal.goalId)}
                      >
                        {goal.status === 'active' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-bold">{goal.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden">
                        <motion.div
                          className={`h-3 rounded-full ${
                            isCompleted ? 'bg-green-500' :
                            goal.status === 'paused' ? 'bg-gray-500' :
                            'bg-primary'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(goal.percentage, 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>{formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Faltam:</span>
                        <span className="font-bold">
                          {formatCurrency(goal.targetAmount - goal.currentAmount)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Prazo:</span>
                        <span className={`font-medium ${
                          isPastDeadline ? 'text-red-500' :
                          isNearDeadline ? 'text-amber-500' :
                          'text-foreground'
                        }`}>
                          {formatDate(goal.deadline)}
                        </span>
                      </div>

                      {goal.monthlyContribution > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Aporte mensal:</span>
                          <span className="font-medium">
                            {formatCurrency(goal.monthlyContribution)}
                          </span>
                          {goal.autoContribute && (
                            <Badge variant="success" className="text-xs ml-auto">
                              Auto
                            </Badge>
                          )}
                        </div>
                      )}

                      {daysUntilDeadline > 0 && !isCompleted && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {daysUntilDeadline} dias restantes
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Alerts */}
                    {isPastDeadline && !isCompleted && (
                      <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Prazo vencido
                        </p>
                      </div>
                    )}

                    {isNearDeadline && !isCompleted && (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Prazo se aproximando
                        </p>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Meta concluída! 🎉
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    {!isCompleted && goal.status === 'active' && (
                      <Button
                        className="w-full gap-2"
                        onClick={() => handleContribute(goal)}
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Aporte
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <GoalForm
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddGoal}
        />
      )}

      {/* Contribute Modal */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-2">Adicionar Aporte</h2>
            <p className="text-muted-foreground mb-4">
              Meta: {selectedGoal.name}
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Valor do Aporte
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Valor Atual:</span>
                  <span className="font-bold">{formatCurrency(selectedGoal.currentAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Novo Valor:</span>
                  <span className="font-bold text-green-500">
                    {formatCurrency(selectedGoal.currentAmount + (parseFloat(contributionAmount) || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Meta:</span>
                  <span className="font-bold">{formatCurrency(selectedGoal.targetAmount)}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setShowContributeModal(false)
                setSelectedGoal(null)
                setContributionAmount('')
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmContribution}
                disabled={!contributionAmount || parseFloat(contributionAmount) <= 0}
              >
                Confirmar Aporte
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
