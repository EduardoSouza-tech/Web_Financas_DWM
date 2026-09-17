'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Calendar, DollarSign, TrendingUp, AlertCircle, X, Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useFinance } from '@/contexts/FinanceContext';
import { formatMonth } from '@/lib/finance/credit-card';

export default function CardsPage() {
  const { cards, setCards, getInstallmentsForInvoice } = useFinance();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [cardForm, setCardForm] = useState({
    name: '',
    brand: 'visa' as 'visa' | 'mastercard' | 'elo',
    limit: '',
    closingDay: '',
    dueDay: ''
  });

  // Recalculate totals based on current cards (DYNAMIC - updates when cards change)
  // These values automatically reflect in the overview dashboard
  const totalLimit = cards.reduce((sum, card) => sum + card.limit, 0);
  const totalUsed = cards.reduce((sum, card) => sum + card.used, 0);
  const totalAvailable = totalLimit - totalUsed;
  const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  const nextDues = cards
    .map(card => ({
      ...card,
      daysUntil: Math.ceil((new Date(card.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const handleAddCard = () => {
    if (!cardForm.name || !cardForm.limit) return;

    const today = new Date();
    const closingDay = parseInt(cardForm.closingDay) || 5;
    const dueDay = parseInt(cardForm.dueDay) || 15;
    const limit = parseFloat(cardForm.limit);

    const newCard = {
      id: `card-${Date.now()}`,
      name: cardForm.name,
      brand: cardForm.brand,
      limit,
      used: 0,
      availableLimit: limit,
      closingDay,
      dueDay,
      lastFourDigits: '****',
      color: cardForm.brand === 'visa' ? 'from-blue-600 to-blue-800' : cardForm.brand === 'mastercard' ? 'from-orange-600 to-red-700' : 'from-yellow-500 to-yellow-700',
      nextInvoice: 0,
      nextDueDate: new Date(today.getFullYear(), today.getMonth() + 1, dueDay).toISOString().split('T')[0],
      installments: 0
    };

    setCards([...cards, newCard as any]);
    setCardForm({ name: '', brand: 'visa', limit: '', closingDay: '', dueDay: '' });
    setShowAddModal(false);
  };

  const handleEditCard = () => {
    if (!selectedCard || !cardForm.name || !cardForm.limit) return;

    const updatedCards = cards.map(card => {
      if (card.id === selectedCard.id) {
        const limit = parseFloat(cardForm.limit);
        return {
          ...card,
          name: cardForm.name,
          brand: cardForm.brand as any,
          limit,
          availableLimit: limit - card.used,
          closingDay: parseInt(cardForm.closingDay) || card.closingDay,
          dueDay: parseInt(cardForm.dueDay) || card.dueDay
        };
      }
      return card;
    });

    setCards(updatedCards);
    setShowEditModal(false);
    setSelectedCard(null);
  };

  const openEditModal = (card: any) => {
    setSelectedCard(card);
    setCardForm({
      name: card.name,
      brand: card.brand,
      limit: card.limit.toString(),
      closingDay: card.closingDay?.toString() || '10',
      dueDay: card.dueDay?.toString() || '15'
    });
    setShowEditModal(true);
  };

  const openInvoiceModal = (card: any) => {
    setSelectedCard(card);
    setShowInvoiceModal(true);
  };

  const handleDeleteCard = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const confirmMessage = `Tem certeza que deseja excluir o cartão "${card.name}"?\n\nIsso não excluirá as transações já registradas.`;
    if (confirm(confirmMessage)) {
      setCards(cards.filter(c => c.id !== cardId));
    }
  };

  // Parcelas da fatura aberta hoje (a que ainda vai fechar)
  const getCardTransactions = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return [];
    return getInstallmentsForInvoice(card.openInvoiceMonth, cardId).map(i => ({
      id: i.key,
      description: i.total > 1 ? `${i.description} (${i.number}/${i.total})` : i.description,
      date: i.purchaseDate,
      amount: i.amount,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Add Card Modal */}
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
              className="bg-background border rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Adicionar Cartão</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome do Cartão</label>
                  <Input
                    placeholder="Ex: Nubank Ultravioleta"
                    value={cardForm.name}
                    onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Bandeira</label>
                  <select
                    value={cardForm.brand}
                    onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border rounded-md"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="elo">Elo</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Limite</label>
                  <Input
                    type="number"
                    placeholder="R$ 5000.00"
                    value={cardForm.limit}
                    onChange={(e) => setCardForm({ ...cardForm, limit: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Dia Fechamento</label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={cardForm.closingDay}
                      onChange={(e) => setCardForm({ ...cardForm, closingDay: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Dia Vencimento</label>
                    <Input
                      type="number"
                      placeholder="15"
                      value={cardForm.dueDay}
                      onChange={(e) => setCardForm({ ...cardForm, dueDay: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleAddCard} className="flex-1">
                  Adicionar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Card Modal */}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Editar Cartão</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome do Cartão</label>
                  <Input
                    value={cardForm.name}
                    onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Bandeira</label>
                  <select
                    value={cardForm.brand}
                    onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border rounded-md"
                  >
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="elo">Elo</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Limite</label>
                  <Input
                    type="number"
                    value={cardForm.limit}
                    onChange={(e) => setCardForm({ ...cardForm, limit: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Dia Fechamento</label>
                    <Input
                      type="number"
                      value={cardForm.closingDay}
                      onChange={(e) => setCardForm({ ...cardForm, closingDay: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Dia Vencimento</label>
                    <Input
                      type="number"
                      value={cardForm.dueDay}
                      onChange={(e) => setCardForm({ ...cardForm, dueDay: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleEditCard} className="flex-1">
                  Salvar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {showInvoiceModal && selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowInvoiceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">Fatura - {selectedCard.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Vencimento: {new Date(selectedCard.nextDueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowInvoiceModal(false)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="mb-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Fatura de {formatMonth(selectedCard.openInvoiceMonth)}</p>
                    <p className="text-2xl font-bold">
                      {selectedCard.nextInvoice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Limite Disponível</p>
                    <p className="text-lg font-semibold text-green-600">
                      {selectedCard.availableLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Transações</h4>
                {getCardTransactions(selectedCard.id).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma transação neste cartão</p>
                ) : (
                  <div className="space-y-2">
                    {getCardTransactions(selectedCard.id).map((tx: any) => (
                      <div key={tx.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">{tx.date.split('-').reverse().join('/')}</p>
                        </div>
                        <p className="font-semibold">
                          {tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cartões de Crédito</h1>
          <p className="text-muted-foreground">Gerencie seus cartões e faturas</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" />
          Adicionar Cartão
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Limite Total</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponível</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalAvailable.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(100 - usagePercentage).toFixed(1)}% livre
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilizado</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {totalUsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {usagePercentage.toFixed(1)}% do limite
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximo Vencimento</CardTitle>
              <Calendar className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {nextDues[0]?.daysUntil} dias
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {nextDues[0]?.name}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const usedPercent = (card.used / card.limit) * 100;
          const available = card.limit - card.used;
          const daysUntilDue = Math.ceil((new Date(card.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                {/* Card Visual */}
                <div className={`relative h-48 bg-gradient-to-br ${card.color} p-6 text-white`}>
                  <div className="flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm opacity-80">Cartão de Crédito</p>
                        <p className="font-bold text-lg mt-1">{card.name}</p>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {card.brand.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-2xl font-mono tracking-wider">
                        •••• •••• •••• {card.lastFourDigits}
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <div>
                          <p className="text-xs opacity-80">Limite</p>
                          <p className="font-semibold">
                            {card.limit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-80">Vencimento</p>
                          <p className="font-semibold">Dia {card.dueDay}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <CardContent className="p-6 space-y-4">
                  {/* Usage Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Utilizado</span>
                      <span className="font-semibold">
                        {card.used.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <Progress value={usedPercent} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{usedPercent.toFixed(1)}% usado</span>
                      <span>
                        {available.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} disponível
                      </span>
                    </div>
                  </div>

                  {/* Next Invoice */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Próxima Fatura</p>
                      <p className="font-semibold">
                        {card.nextInvoice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <Badge variant={daysUntilDue <= 5 ? 'danger' : 'secondary'}>
                      {daysUntilDue} dias
                    </Badge>
                  </div>

                  {/* Installments */}
                  {card.installments > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="w-4 h-4" />
                      <span>{card.installments} parcelas ativas</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-1" 
                      size="sm"
                      onClick={() => openInvoiceModal(card)}
                    >
                      <Eye className="w-3 h-3" />
                      Ver Fatura
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1"
                      onClick={() => openEditModal(card)}
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
