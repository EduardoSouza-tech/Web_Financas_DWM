'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Filter, 
  Download, 
  Upload,
  Calendar,
  Tag,
  CreditCard,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Edit,
  FileText
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import TransactionForm from '@/components/forms/transaction-form'

interface Transaction {
  txId: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  date: string
  categoryId: string
  categoryName: string
  categoryIcon: string
  description: string
  accountId: string
  accountName: string
  tags: string[]
  status: 'pending' | 'completed' | 'cancelled'
  isInstallment: boolean
  installmentNumber?: number
  installmentTotal?: number
  attachments?: string[]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Mock data - substituir por chamada API
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        txId: '1',
        type: 'income',
        amount: 5000,
        date: '2025-11-01',
        categoryId: 'salary',
        categoryName: 'Salário',
        categoryIcon: '💼',
        description: 'Salário mensal',
        accountId: 'acc1',
        accountName: 'Conta Corrente',
        tags: ['trabalho', 'mensal'],
        status: 'completed',
        isInstallment: false
      },
      {
        txId: '2',
        type: 'expense',
        amount: 350,
        date: '2025-11-03',
        categoryId: 'food',
        categoryName: 'Alimentação',
        categoryIcon: '🍔',
        description: 'Mercado Atacadão',
        accountId: 'acc1',
        accountName: 'Conta Corrente',
        tags: ['supermercado', 'essencial'],
        status: 'completed',
        isInstallment: false
      },
      {
        txId: '3',
        type: 'expense',
        amount: 150,
        date: '2025-11-05',
        categoryId: 'transport',
        categoryName: 'Transporte',
        categoryIcon: '🚗',
        description: 'Gasolina posto Shell',
        accountId: 'acc2',
        accountName: 'Cartão Crédito',
        tags: ['combustível'],
        status: 'completed',
        isInstallment: false
      },
      {
        txId: '4',
        type: 'expense',
        amount: 1200,
        date: '2025-11-07',
        categoryId: 'shopping',
        categoryName: 'Compras',
        categoryIcon: '🛍️',
        description: 'Notebook Dell',
        accountId: 'acc2',
        accountName: 'Cartão Crédito',
        tags: ['eletrônicos', 'trabalho'],
        status: 'completed',
        isInstallment: true,
        installmentNumber: 1,
        installmentTotal: 12
      },
      {
        txId: '5',
        type: 'expense',
        amount: 89.90,
        date: '2025-11-10',
        categoryId: 'entertainment',
        categoryName: 'Lazer',
        categoryIcon: '🎮',
        description: 'Netflix Premium',
        accountId: 'acc1',
        accountName: 'Conta Corrente',
        tags: ['streaming', 'assinatura'],
        status: 'pending',
        isInstallment: false
      },
      {
        txId: '6',
        type: 'income',
        amount: 450,
        date: '2025-11-12',
        categoryId: 'freelance',
        categoryName: 'Freelance',
        categoryIcon: '💻',
        description: 'Projeto website',
        accountId: 'acc1',
        accountName: 'Conta Corrente',
        tags: ['extra', 'desenvolvimento'],
        status: 'completed',
        isInstallment: false
      }
    ]

    setTimeout(() => {
      setTransactions(mockTransactions)
      setFilteredTransactions(mockTransactions)
      setLoading(false)
    }, 500)
  }, [])

  // Filtros
  useEffect(() => {
    let filtered = transactions

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType)
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredTransactions(filtered)
  }, [searchTerm, filterType, transactions])

  const stats = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    balance: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - 
             transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    count: transactions.length
  }

  const handleDelete = (txId: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      setTransactions(prev => prev.filter(tx => tx.txId !== txId))
    }
  }

  const handleAddTransaction = (transaction: any) => {
    const newTransaction: Transaction = {
      txId: `tx-${Date.now()}`,
      ...transaction,
      installmentNumber: transaction.isInstallment ? 1 : undefined,
    }
    setTransactions(prev => [newTransaction, ...prev])
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as suas movimentações financeiras
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Transação
          </Button>
        </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Receitas</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(stats.totalIncome)}
                  </p>
                </div>
                <ArrowUpCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Despesas</p>
                  <p className="text-2xl font-bold text-red-500">
                    {formatCurrency(stats.totalExpense)}
                  </p>
                </div>
                <ArrowDownCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo do Período</p>
                  <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(stats.balance)}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transações</p>
                  <p className="text-2xl font-bold">
                    {stats.count}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, categoria ou tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                size="sm"
              >
                Todas
              </Button>
              <Button
                variant={filterType === 'income' ? 'default' : 'outline'}
                onClick={() => setFilterType('income')}
                size="sm"
                className="gap-1"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Receitas
              </Button>
              <Button
                variant={filterType === 'expense' ? 'default' : 'outline'}
                onClick={() => setFilterType('expense')}
                size="sm"
                className="gap-1"
              >
                <ArrowDownCircle className="w-4 h-4" />
                Despesas
              </Button>
            </div>

            {/* More Filters Button */}
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Mais Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <motion.div 
              className="space-y-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredTransactions.map((tx) => (
                <motion.div
                  key={tx.txId}
                  variants={itemVariants}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Icon & Category */}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        tx.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {tx.categoryIcon}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">{tx.categoryName}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{tx.accountName}</span>
                          {tx.isInstallment && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <Badge variant="outline" className="text-xs">
                                {tx.installmentNumber}/{tx.installmentTotal}x
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="hidden md:flex gap-1">
                    {tx.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Date */}
                  <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground min-w-[100px]">
                    <Calendar className="w-4 h-4" />
                    {formatDate(tx.date)}
                  </div>

                  {/* Amount */}
                  <div className="text-right min-w-[120px]">
                    <p className={`text-lg font-bold ${
                      tx.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </p>
                    <Badge 
                      variant={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'default'}
                      className="text-xs"
                    >
                      {tx.status === 'completed' ? 'Concluído' : tx.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(tx.txId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button (Mobile) */}
      <motion.button
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddModal(true)}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* TODO: Add Transaction Modal */}
      {showAddModal && (
        <TransactionForm
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTransaction}
        />
      )}
    </div>
  )
}
