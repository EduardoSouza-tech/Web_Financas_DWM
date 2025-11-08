'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, DollarSign, TrendingUp, Zap, Pause, Play, Trash2, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  nextPayment: string;
  status: 'active' | 'paused' | 'cancelled';
  autoRenew: boolean;
  icon: string;
  color: string;
}

const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    category: 'Entretenimento',
    amount: 55.90,
    frequency: 'monthly',
    nextPayment: '2025-11-15',
    status: 'active',
    autoRenew: true,
    icon: '🎬',
    color: 'from-red-500 to-red-700'
  },
  {
    id: '2',
    name: 'Spotify Premium',
    category: 'Entretenimento',
    amount: 21.90,
    frequency: 'monthly',
    nextPayment: '2025-11-20',
    status: 'active',
    autoRenew: true,
    icon: '🎵',
    color: 'from-green-500 to-green-700'
  },
  {
    id: '3',
    name: 'Amazon Prime',
    category: 'Entretenimento',
    amount: 14.90,
    frequency: 'monthly',
    nextPayment: '2025-11-10',
    status: 'active',
    autoRenew: true,
    icon: '📦',
    color: 'from-orange-500 to-orange-700'
  },
  {
    id: '4',
    name: 'GitHub Pro',
    category: 'Produtividade',
    amount: 4.00,
    frequency: 'monthly',
    nextPayment: '2025-11-12',
    status: 'active',
    autoRenew: true,
    icon: '💻',
    color: 'from-gray-700 to-gray-900'
  },
  {
    id: '5',
    name: 'Adobe Creative Cloud',
    category: 'Produtividade',
    amount: 99.00,
    frequency: 'monthly',
    nextPayment: '2025-11-25',
    status: 'paused',
    autoRenew: false,
    icon: '🎨',
    color: 'from-purple-500 to-purple-700'
  }
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [subForm, setSubForm] = useState({
    name: '',
    category: '',
    amount: '',
    frequency: 'monthly' as 'monthly' | 'yearly' | 'weekly',
    icon: '📱',
    autoRenew: true
  });

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
    if (sub.frequency === 'monthly') return sum + sub.amount;
    if (sub.frequency === 'yearly') return sum + (sub.amount / 12);
    if (sub.frequency === 'weekly') return sum + (sub.amount * 4);
    return sum;
  }, 0);
  const yearlyTotal = monthlyTotal * 12;

  const nextPayments = subscriptions
    .filter(s => s.status === 'active')
    .map(sub => ({
      ...sub,
      daysUntil: Math.ceil((new Date(sub.nextPayment).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  const handleTogglePause = (id: string) => {
    setSubscriptions(subscriptions.map(sub => {
      if (sub.id === id) {
        return {
          ...sub,
          status: sub.status === 'active' ? 'paused' : 'active',
          autoRenew: sub.status === 'active' ? false : true
        };
      }
      return sub;
    }));
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta assinatura?')) {
      setSubscriptions(subscriptions.filter(sub => sub.id !== id));
    }
  };

  const handleAddSubscription = () => {
    if (!subForm.name || !subForm.amount) return;

    const today = new Date();
    const nextPayment = new Date(today);
    nextPayment.setMonth(today.getMonth() + 1);

    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      name: subForm.name,
      category: subForm.category || 'Outros',
      amount: parseFloat(subForm.amount),
      frequency: subForm.frequency,
      nextPayment: nextPayment.toISOString().split('T')[0],
      status: 'active',
      autoRenew: subForm.autoRenew,
      icon: subForm.icon,
      color: 'from-blue-500 to-blue-700'
    };

    setSubscriptions([...subscriptions, newSub]);
    setSubForm({ name: '', category: '', amount: '', frequency: 'monthly', icon: '📱', autoRenew: true });
    setShowAddModal(false);
  };

  const handleEditSubscription = () => {
    if (!selectedSub || !subForm.name || !subForm.amount) return;

    setSubscriptions(subscriptions.map(sub => {
      if (sub.id === selectedSub.id) {
        return {
          ...sub,
          name: subForm.name,
          category: subForm.category || sub.category,
          amount: parseFloat(subForm.amount),
          frequency: subForm.frequency,
          icon: subForm.icon,
          autoRenew: subForm.autoRenew
        };
      }
      return sub;
    }));

    setShowEditModal(false);
    setSelectedSub(null);
  };

  const openEditModal = (sub: Subscription) => {
    setSelectedSub(sub);
    setSubForm({
      name: sub.name,
      category: sub.category,
      amount: sub.amount.toString(),
      frequency: sub.frequency,
      icon: sub.icon,
      autoRenew: sub.autoRenew
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Add Subscription Modal */}
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
                <h3 className="text-xl font-bold">Nova Assinatura</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome</label>
                  <Input
                    placeholder="Ex: Netflix"
                    value={subForm.name}
                    onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Input
                    placeholder="Ex: Entretenimento"
                    value={subForm.category}
                    onChange={(e) => setSubForm({ ...subForm, category: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Valor</label>
                  <Input
                    type="number"
                    placeholder="R$ 55.90"
                    value={subForm.amount}
                    onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Frequência</label>
                  <select
                    value={subForm.frequency}
                    onChange={(e) => setSubForm({ ...subForm, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border rounded-md"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ícone (Emoji)</label>
                  <Input
                    placeholder="📱"
                    value={subForm.icon}
                    onChange={(e) => setSubForm({ ...subForm, icon: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={subForm.autoRenew}
                    onChange={(e) => setSubForm({ ...subForm, autoRenew: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="autoRenew" className="text-sm">Renovação Automática</label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleAddSubscription} className="flex-1">
                  Adicionar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Subscription Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-background border rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Editar Assinatura</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome</label>
                  <Input
                    value={subForm.name}
                    onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Input
                    value={subForm.category}
                    onChange={(e) => setSubForm({ ...subForm, category: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Valor</label>
                  <Input
                    type="number"
                    value={subForm.amount}
                    onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Frequência</label>
                  <select
                    value={subForm.frequency}
                    onChange={(e) => setSubForm({ ...subForm, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border rounded-md"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ícone (Emoji)</label>
                  <Input
                    value={subForm.icon}
                    onChange={(e) => setSubForm({ ...subForm, icon: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editAutoRenew"
                    checked={subForm.autoRenew}
                    onChange={(e) => setSubForm({ ...subForm, autoRenew: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="editAutoRenew" className="text-sm">Renovação Automática</label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleEditSubscription} className="flex-1">
                  Salvar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assinaturas</h1>
          <p className="text-muted-foreground">Gerencie todas as suas assinaturas recorrentes</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Nova Assinatura
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gasto Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthlyTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeSubscriptions.length} assinaturas ativas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projeção Anual</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {yearlyTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                12 meses de assinaturas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximo Pagamento</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nextPayments[0]?.daysUntil} dias
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {nextPayments[0]?.name}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assinaturas</CardTitle>
              <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeSubscriptions.length} ativas • {subscriptions.filter(s => s.status === 'paused').length} pausadas
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subscriptions.map((sub, index) => (
          <motion.div
            key={sub.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={sub.status === 'paused' ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sub.color} flex items-center justify-center text-2xl`}>
                      {sub.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{sub.name}</CardTitle>
                      <CardDescription>{sub.category}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                    {sub.status === 'active' ? 'Ativa' : 'Pausada'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">
                    {sub.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sub.frequency === 'monthly' ? 'por mês' : 
                     sub.frequency === 'yearly' ? 'por ano' : 
                     'por semana'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Próximo pagamento</span>
                  <span className="font-semibold">
                    {new Date(sub.nextPayment).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Renovação automática</span>
                  <Badge variant={sub.autoRenew ? 'default' : 'secondary'}>
                    {sub.autoRenew ? 'Sim' : 'Não'}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleTogglePause(sub.id)}
                  >
                    {sub.status === 'active' ? (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Reativar
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditModal(sub)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(sub.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Upcoming Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Pagamentos</CardTitle>
          <CardDescription>Pagamentos programados para os próximos dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nextPayments.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${sub.color} flex items-center justify-center text-2xl`}>
                    {sub.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{sub.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sub.nextPayment).toLocaleDateString('pt-BR')} • Em {sub.daysUntil} dias
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {sub.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <Badge variant={sub.daysUntil <= 3 ? 'danger' : 'secondary'}>
                    {sub.daysUntil <= 3 ? 'Próximo' : 'Em breve'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
