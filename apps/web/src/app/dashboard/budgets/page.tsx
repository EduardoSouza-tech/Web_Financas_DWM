'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  Settings,
  Calendar,
  DollarSign,
  X
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface BudgetCategory {
  categoryId: string
  categoryName: string
  categoryIcon: string
  budgeted: number
  spent: number
  remaining: number
  percentage: number
  status: 'ok' | 'warning' | 'danger'
}

interface Budget {
  budgetId: string
  name: string
  month: string
  type: 'zero-based' | '50-30-20' | 'envelope'
  totalBudget: number
  totalSpent: number
  categories: BudgetCategory[]
  rolloverEnabled: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function BudgetsPage() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📂', budgeted: '' })
  const [configForm, setConfigForm] = useState({
    name: '',
    type: 'zero-based' as 'zero-based' | '50-30-20' | 'envelope',
    totalBudget: '',
    rolloverEnabled: true
  })
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Mock data
  useEffect(() => {
    const mockBudget: Budget = {
      budgetId: '1',
      name: 'Orçamento Novembro 2025',
      month: '2025-11',
      type: '50-30-20',
      totalBudget: 5000,
      totalSpent: 3289.90,
      rolloverEnabled: true,
      categories: [
        {
          categoryId: 'housing',
          categoryName: 'Moradia',
          categoryIcon: '🏠',
          budgeted: 1500,
          spent: 1450,
          remaining: 50,
          percentage: 96.7,
          status: 'warning'
        },
        {
          categoryId: 'food',
          categoryName: 'Alimentação',
          categoryIcon: '🍔',
          budgeted: 800,
          spent: 650,
          remaining: 150,
          percentage: 81.3,
          status: 'ok'
        },
        {
          categoryId: 'transport',
          categoryName: 'Transporte',
          categoryIcon: '🚗',
          budgeted: 500,
          spent: 450,
          remaining: 50,
          percentage: 90,
          status: 'ok'
        },
        {
          categoryId: 'entertainment',
          categoryName: 'Lazer',
          categoryIcon: '🎮',
          budgeted: 400,
          spent: 289.90,
          remaining: 110.10,
          percentage: 72.5,
          status: 'ok'
        },
        {
          categoryId: 'health',
          categoryName: 'Saúde',
          categoryIcon: '💊',
          budgeted: 300,
          spent: 350,
          remaining: -50,
          percentage: 116.7,
          status: 'danger'
        },
        {
          categoryId: 'education',
          categoryName: 'Educação',
          categoryIcon: '📚',
          budgeted: 600,
          spent: 100,
          remaining: 500,
          percentage: 16.7,
          status: 'ok'
        },
        {
          categoryId: 'savings',
          categoryName: 'Poupança',
          categoryIcon: '💰',
          budgeted: 900,
          spent: 0,
          remaining: 900,
          percentage: 0,
          status: 'ok'
        }
      ]
    }

    setTimeout(() => {
      setBudget(mockBudget)
      setLoading(false)
      // Initialize config form with current budget data
      setConfigForm({
        name: mockBudget.name,
        type: mockBudget.type,
        totalBudget: mockBudget.totalBudget.toString(),
        rolloverEnabled: mockBudget.rolloverEnabled
      })
    }, 500)
  }, [])

  const handleAddCategory = () => {
    if (!budget || !newCategory.name || !newCategory.budgeted) return

    const newCat: BudgetCategory = {
      categoryId: `cat-${Date.now()}`,
      categoryName: newCategory.name,
      categoryIcon: newCategory.icon,
      budgeted: parseFloat(newCategory.budgeted),
      spent: 0,
      remaining: parseFloat(newCategory.budgeted),
      percentage: 0,
      status: 'ok'
    }

    setBudget({
      ...budget,
      categories: [...budget.categories, newCat],
      totalBudget: budget.totalBudget + parseFloat(newCategory.budgeted)
    })

    setNewCategory({ name: '', icon: '📂', budgeted: '' })
    setShowAddModal(false)
  }

  const handleConfigBudget = () => {
    if (!budget || !configForm.name || !configForm.totalBudget) return

    setBudget({
      ...budget,
      name: configForm.name,
      type: configForm.type,
      totalBudget: parseFloat(configForm.totalBudget),
      rolloverEnabled: configForm.rolloverEnabled
    })

    setShowConfigModal(false)
  }

  const handleEditCategory = (categoryId: string, newBudgeted: number) => {
    if (!budget) return

    const updatedCategories = budget.categories.map(cat => {
      if (cat.categoryId === categoryId) {
        const remaining = newBudgeted - cat.spent
        const percentage = (cat.spent / newBudgeted) * 100
        const status: 'ok' | 'warning' | 'danger' = 
          percentage >= 100 ? 'danger' : percentage >= 90 ? 'warning' : 'ok'
        
        return {
          ...cat,
          budgeted: newBudgeted,
          remaining,
          percentage,
          status
        }
      }
      return cat
    })

    const totalBudget = updatedCategories.reduce((sum, cat) => sum + cat.budgeted, 0)

    setBudget({
      ...budget,
      categories: updatedCategories,
      totalBudget
    })
  }

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const overallPercentage = (budget.totalSpent / budget.totalBudget) * 100
  const remaining = budget.totalBudget - budget.totalSpent
  const overbudgetCategories = budget.categories.filter(c => c.status === 'danger').length
  const warningCategories = budget.categories.filter(c => c.status === 'warning').length

  return (
    <div className="space-y-6 p-6">
      {/* Config Budget Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfigModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-background border rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Configurar Orçamento</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfigModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome do Orçamento</label>
                  <Input
                    placeholder="Ex: Orçamento Dezembro 2025"
                    value={configForm.name}
                    onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Orçamento</label>
                  <select
                    value={configForm.type}
                    onChange={(e) => setConfigForm({ ...configForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border rounded-md"
                  >
                    <option value="zero-based">Base Zero</option>
                    <option value="50-30-20">Regra 50-30-20</option>
                    <option value="envelope">Sistema de Envelopes</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Orçamento Total</label>
                  <Input
                    type="number"
                    placeholder="R$ 5000.00"
                    value={configForm.totalBudget}
                    onChange={(e) => setConfigForm({ ...configForm, totalBudget: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rollover"
                    checked={configForm.rolloverEnabled}
                    onChange={(e) => setConfigForm({ ...configForm, rolloverEnabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="rollover" className="text-sm">
                    Permitir saldo remanescente para próximo mês
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfigBudget}
                  className="flex-1"
                >
                  Salvar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Category Modal */}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-background border rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Nova Categoria</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome da Categoria</label>
                  <Input
                    placeholder="Ex: Academia"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ícone (Emoji)</label>
                  <Input
                    placeholder="📂"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Valor Orçado</label>
                  <Input
                    type="number"
                    placeholder="R$ 200.00"
                    value={newCategory.budgeted}
                    onChange={(e) => setNewCategory({ ...newCategory, budgeted: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddCategory}
                  className="flex-1"
                >
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
          <h1 className="text-3xl font-bold">Orçamento</h1>
          <p className="text-muted-foreground mt-1">
            Planeje e controle seus gastos mensais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Mudar Mês
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setShowConfigModal(true)}
          >
            <Settings className="w-4 h-4" />
            Configurar
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Categoria
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
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
                <p className="text-sm text-muted-foreground">Orçamento Total</p>
                <p className="text-3xl font-bold">{formatCurrency(budget.totalBudget)}</p>
                <Badge variant="info" className="mt-2">
                  Método: {budget.type === '50-30-20' ? '50/30/20' : budget.type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Gasto no Mês</p>
                <p className="text-3xl font-bold text-red-500">{formatCurrency(budget.totalSpent)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        overallPercentage > 100 ? 'bg-red-500' : 
                        overallPercentage > 80 ? 'bg-amber-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{formatPercent(overallPercentage)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Saldo Restante</p>
                <p className={`text-3xl font-bold ${remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(Math.abs(remaining))}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {remaining >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">Dentro do orçamento</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">Acima do orçamento</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="space-y-2">
                  {overbudgetCategories > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="text-sm">{overbudgetCategories} categoria(s) estourada(s)</span>
                    </div>
                  )}
                  {warningCategories > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <span className="text-sm">{warningCategories} próximo(s) do limite</span>
                    </div>
                  )}
                  {overbudgetCategories === 0 && warningCategories === 0 && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Tudo sob controle</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Budget Type Info */}
      {budget.type === '50-30-20' && (
        <Card className="glass border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Método 50/30/20</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Divida sua renda em: 50% necessidades, 30% desejos, 20% poupança/investimentos
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">50% Necessidades</p>
                    <p className="text-2xl font-bold text-blue-500">{formatCurrency(budget.totalBudget * 0.5)}</p>
                    <p className="text-xs text-muted-foreground">Moradia, alimentação, transporte</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">30% Desejos</p>
                    <p className="text-2xl font-bold text-purple-500">{formatCurrency(budget.totalBudget * 0.3)}</p>
                    <p className="text-xs text-muted-foreground">Lazer, compras, entretenimento</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">20% Poupança</p>
                    <p className="text-2xl font-bold text-green-500">{formatCurrency(budget.totalBudget * 0.2)}</p>
                    <p className="text-xs text-muted-foreground">Investimentos, reserva</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Budget */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Orçamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {budget.categories.map((category) => (
              <motion.div
                key={category.categoryId}
                variants={itemVariants}
                className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      category.status === 'danger' ? 'bg-red-500/20' :
                      category.status === 'warning' ? 'bg-amber-500/20' :
                      'bg-green-500/20'
                    }`}>
                      {category.categoryIcon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{category.categoryName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(category.spent)} de {formatCurrency(category.budgeted)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <p className={`text-lg font-bold ${
                        category.remaining >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {category.remaining >= 0 ? '+' : ''}{formatCurrency(category.remaining)}
                      </p>
                      <Badge 
                        variant={
                          category.status === 'danger' ? 'danger' :
                          category.status === 'warning' ? 'warning' :
                          'success'
                        }
                        className="mt-1"
                      >
                        {formatPercent(category.percentage)}
                      </Badge>
                    </div>
                    {editingCategory === category.categoryId ? (
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 h-8 text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            handleEditCategory(category.categoryId, parseFloat(editValue))
                            setEditingCategory(null)
                          }}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditingCategory(category.categoryId)
                          setEditValue(category.budgeted.toString())
                        }}
                      >
                        Editar Valor
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden">
                    <motion.div 
                      className={`h-3 rounded-full ${
                        category.status === 'danger' ? 'bg-red-500' :
                        category.status === 'warning' ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(category.percentage, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                    {category.percentage > 100 && (
                      <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Gasto: {formatPercent(category.percentage)}</span>
                    {category.percentage > 100 ? (
                      <span className="text-red-500 font-medium">
                        Excedido em {formatCurrency(Math.abs(category.remaining))}
                      </span>
                    ) : (
                      <span className="text-green-500 font-medium">
                        Restam {formatCurrency(category.remaining)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Alert Messages */}
                {category.status === 'danger' && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Orçamento excedido! Considere ajustar seus gastos nesta categoria.
                    </p>
                  </div>
                )}
                {category.status === 'warning' && (
                  <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Atenção! Você está próximo do limite desta categoria.
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Configurações do Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Roll-over (Saldo restante para próximo mês)</p>
                <p className="text-sm text-muted-foreground">
                  Transferir saldo não utilizado para o próximo período
                </p>
              </div>
              <Button 
                variant={budget.rolloverEnabled ? 'default' : 'outline'}
                onClick={() => setBudget(prev => prev ? {...prev, rolloverEnabled: !prev.rolloverEnabled} : null)}
              >
                {budget.rolloverEnabled ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-lg p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-4">Nova Categoria</h2>
            <p className="text-muted-foreground mb-4">
              Formulário de adição será implementado aqui
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setShowAddModal(false)}>
                Adicionar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
