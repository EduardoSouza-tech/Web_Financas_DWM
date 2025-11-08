'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  PiggyBank,
  Calendar,
  BarChart3,
  Download
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Insight {
  id: string
  type: 'success' | 'warning' | 'danger' | 'info'
  category: 'spending' | 'saving' | 'budget' | 'goal' | 'forecast'
  title: string
  description: string
  action?: string
  impact: 'high' | 'medium' | 'low'
  createdAt: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Mock data
  useEffect(() => {
    const mockInsights: Insight[] = [
      {
        id: '1',
        type: 'warning',
        category: 'spending',
        title: 'Gastos com alimentação acima da média',
        description: 'Você gastou R$ 850 com alimentação este mês, 35% acima da média dos últimos 3 meses (R$ 630). Considere revisar seus hábitos ou ajustar o orçamento.',
        action: 'Ver detalhes de alimentação',
        impact: 'high',
        createdAt: '2025-11-07'
      },
      {
        id: '2',
        type: 'success',
        category: 'saving',
        title: 'Meta de economia alcançada! 🎉',
        description: 'Parabéns! Você economizou R$ 1.200 este mês, superando sua meta de R$ 1.000 em 20%. Continue assim!',
        action: 'Ver metas',
        impact: 'high',
        createdAt: '2025-11-06'
      },
      {
        id: '3',
        type: 'danger',
        category: 'budget',
        title: 'Orçamento de saúde excedido',
        description: 'Categoria "Saúde" ultrapassou o limite em R$ 50. Total gasto: R$ 350 de R$ 300 orçados.',
        action: 'Ajustar orçamento',
        impact: 'medium',
        createdAt: '2025-11-05'
      },
      {
        id: '4',
        type: 'info',
        category: 'forecast',
        title: 'Projeção positiva para próximo mês',
        description: 'Com base no seu padrão de gastos, você deve economizar aproximadamente R$ 1.150 no próximo mês. Saldo projetado: R$ 5.650.',
        action: 'Ver forecast completo',
        impact: 'medium',
        createdAt: '2025-11-04'
      },
      {
        id: '5',
        type: 'success',
        category: 'goal',
        title: 'Meta "Viagem Europa" em dia',
        description: 'Você está 3% à frente do cronograma! Com os aportes atuais, deve concluir a meta 1 mês antes do prazo.',
        action: 'Ver meta',
        impact: 'low',
        createdAt: '2025-11-03'
      },
      {
        id: '6',
        type: 'warning',
        category: 'spending',
        title: 'Aumento de 25% em compras online',
        description: 'Gastos com compras online aumentaram significativamente comparado ao mês passado. De R$ 400 para R$ 500.',
        action: 'Ver transações',
        impact: 'medium',
        createdAt: '2025-11-02'
      },
      {
        id: '7',
        type: 'info',
        category: 'saving',
        title: 'Oportunidade: redução de assinaturas',
        description: 'Você tem 4 assinaturas ativas totalizando R$ 180/mês. Revisar e cancelar as não utilizadas pode economizar até R$ 90/mês.',
        action: 'Gerenciar assinaturas',
        impact: 'high',
        createdAt: '2025-11-01'
      }
    ]

    setTimeout(() => {
      setInsights(mockInsights)
      setLoading(false)
    }, 500)
  }, [])

  const categories = [
    { id: 'all', name: 'Todos', icon: BarChart3 },
    { id: 'spending', name: 'Gastos', icon: TrendingDown },
    { id: 'saving', name: 'Economia', icon: PiggyBank },
    { id: 'budget', name: 'Orçamento', icon: Target },
    { id: 'goal', name: 'Metas', icon: Target },
    { id: 'forecast', name: 'Previsões', icon: TrendingUp },
  ]

  const filteredInsights = selectedCategory === 'all'
    ? insights
    : insights.filter(i => i.category === selectedCategory)

  const stats = {
    total: insights.length,
    high: insights.filter(i => i.impact === 'high').length,
    actionable: insights.filter(i => i.action).length,
    positive: insights.filter(i => i.type === 'success').length,
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'danger': return <AlertTriangle className="w-5 h-5 text-red-500" />
      default: return <Lightbulb className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Insights & Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Análises inteligentes sobre suas finanças
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Este Mês
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total de Insights</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Alta Prioridade</p>
                <p className="text-3xl font-bold mt-1 text-red-500">{stats.high}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Ações Sugeridas</p>
                <p className="text-3xl font-bold mt-1 text-primary">{stats.actionable}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Positivos</p>
                <p className="text-3xl font-bold mt-1 text-green-500">{stats.positive}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Category Filter */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <motion.div 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredInsights.map((insight) => (
            <motion.div key={insight.id} variants={itemVariants}>
              <Card className={`glass border-2 hover:scale-[1.01] transition-all cursor-pointer ${
                insight.type === 'success' ? 'border-green-500/20' :
                insight.type === 'warning' ? 'border-amber-500/20' :
                insight.type === 'danger' ? 'border-red-500/20' :
                'border-blue-500/20'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      insight.type === 'success' ? 'bg-green-500/10' :
                      insight.type === 'warning' ? 'bg-amber-500/10' :
                      insight.type === 'danger' ? 'bg-red-500/10' :
                      'bg-blue-500/10'
                    }`}>
                      {getInsightIcon(insight.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{insight.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(insight.createdAt).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={
                            insight.impact === 'high' ? 'danger' :
                            insight.impact === 'medium' ? 'warning' :
                            'info'
                          }>
                            {insight.impact === 'high' ? 'Alta' :
                             insight.impact === 'medium' ? 'Média' :
                             'Baixa'} Prioridade
                          </Badge>
                          <Badge variant="secondary">
                            {insight.category === 'spending' ? '💸 Gastos' :
                             insight.category === 'saving' ? '💰 Economia' :
                             insight.category === 'budget' ? '📊 Orçamento' :
                             insight.category === 'goal' ? '🎯 Metas' :
                             '📈 Previsão'}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-4">
                        {insight.description}
                      </p>

                      {insight.action && (
                        <Button variant="outline" size="sm" className="gap-2">
                          <Lightbulb className="w-4 h-4" />
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {filteredInsights.length === 0 && !loading && (
        <Card className="glass">
          <CardContent className="pt-12 pb-12 text-center">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Nenhum insight encontrado</h3>
            <p className="text-muted-foreground">
              Selecione outra categoria ou aguarde mais dados para análise
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
