'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/providers/auth-provider';
import { useProfiles } from '@/providers/profile-provider';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Download,
  Trash2,
  Plus,
  Edit,
  Moon,
  Sun,
  Monitor,
  Tag,
  Save,
  X,
  Loader2,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const { categories, addCategory, updateCategory, deleteCategory, countTransactionsInCategory } = useFinance();
  const [profileError, setProfileError] = useState<string | null>(null);
  const { activeProfile, isFamilyView, profiles, updateProfile: updateFamilyProfile } = useProfiles();
  const { expectedIncome } = useFinance();
  const [incomeInput, setIncomeInput] = useState('');
  const [incomeSaved, setIncomeSaved] = useState(false);

  useEffect(() => {
    setIncomeInput(activeProfile?.expected_income ? String(activeProfile.expected_income) : '');
  }, [activeProfile?.id, activeProfile?.expected_income]);

  const handleSaveIncome = async () => {
    if (!activeProfile) return;
    const value = parseFloat(incomeInput);
    const saved = await updateFamilyProfile(activeProfile.id, { expected_income: value > 0 ? value : null });
    setIncomeSaved(!!saved);
    if (saved) setTimeout(() => setIncomeSaved(false), 2500);
  };
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  // Estado do perfil (sincronizado com Supabase)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    monthly_income: 0,
  });

  // Sincronizar com perfil do Supabase
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name,
        email: profile.email,
        monthly_income: profile.monthly_income,
      });
    } else if (user) {
      // Fallback para dados do auth
      setProfileData({
        name: user.user_metadata?.name || 'Usuário',
        email: user.email || '',
        monthly_income: 0,
      });
    }
  }, [profile, user]);

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    budget: true,
    goals: true,
    insights: true,
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; budgetLimit?: number }>({ name: '', budgetLimit: 0 });
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📁',
    type: 'expense' as 'income' | 'expense',
    budgetLimit: 0,
  });

  const handleSaveProfile = async () => {
    setProfileError(null);
    const success = await updateProfile({
      name: profileData.name,
      monthly_income: profileData.monthly_income,
    });

    if (success) {
      setEditingProfile(false);
    } else {
      setProfileError('Não foi possível salvar. O perfil só é salvo com o Supabase configurado e conectado.');
    }
  };

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      addCategory({
        name: newCategory.name,
        icon: newCategory.icon,
        type: newCategory.type,
        budgetLimit: newCategory.type === 'expense' ? newCategory.budgetLimit : undefined,
      });
      setNewCategory({ name: '', icon: '📁', type: 'expense', budgetLimit: 0 });
      setShowAddModal(false);
    }
  };

  const handleStartEdit = (category: any) => {
    setEditingCategory(category.id);
    setEditValues({ name: category.name, budgetLimit: category.budgetLimit || 0 });
  };

  const handleSaveEdit = (categoryId: string) => {
    updateCategory(categoryId, editValues);
    setEditingCategory(null);
    setEditValues({ name: '', budgetLimit: 0 });
  };

  const handleDeleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id);
    const used = category ? countTransactionsInCategory(category.name) : 0;
    const message = used > 0
      ? `A categoria "${category?.name}" tem ${used} transação(ões). Ao excluir, elas passam para "Outros". Continuar?`
      : 'Tem certeza que deseja excluir esta categoria?';
    if (confirm(message)) {
      deleteCategory(id);
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const iconOptions = ['📁', '🍔', '🚗', '🏠', '💰', '💼', '🎯', '🎮', '📱', '👕', '🏥', '✈️', '🎬', '📚', '💊', '🐶', '⚽', '🛒'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-2">Gerencie seu perfil, preferências e dados do sistema</p>
      </div>

      {/* Perfil */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
            <CardDescription>Gerencie suas informações pessoais</CardDescription>
          </div>
          {!editingProfile && (
            <Button variant="outline" onClick={() => setEditingProfile(true)} className="gap-2">
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    disabled={!editingProfile}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <Input
                    value={profileData.email}
                    disabled={true}
                    className="mt-1 bg-muted"
                    title="Email não pode ser alterado"
                  />
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-2">
                <label className="text-sm font-medium">
                  Renda mensal esperada {isFamilyView ? 'da família' : `de ${activeProfile?.name ?? 'perfil'}`}
                </label>
                <p className="text-xs text-muted-foreground">
                  Usada nas Previsões e para avisar quando a receita lançada no mês ficar abaixo do esperado.
                </p>
                {isFamilyView ? (
                  <p className="text-sm">
                    <strong>{formatCurrency(expectedIncome)}</strong>{' '}
                    <span className="text-muted-foreground">
                      (soma dos {profiles.length} perfis; para alterar, entre em cada perfil)
                    </span>
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="100"
                      value={incomeInput}
                      onChange={(e) => setIncomeInput(e.target.value)}
                      className="w-48"
                      placeholder="R$ 0,00"
                    />
                    <Button variant="outline" onClick={handleSaveIncome} className="gap-2">
                      <Save className="w-4 h-4" />
                      Salvar renda
                    </Button>
                    {incomeSaved && <span className="text-sm text-green-600">Salvo</span>}
                  </div>
                )}
              </div>
              {editingProfile && (
                <div className="flex gap-2 justify-end pt-4">
                  {profileError && <p className="text-sm text-red-500 mr-auto self-center">{profileError}</p>}
                  <Button variant="outline" onClick={() => { setEditingProfile(false); setProfileError(null); }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveProfile} className="gap-2">
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>Configure como deseja receber alertas e atualizações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Notificações por Email</div>
              <div className="text-sm text-muted-foreground">Receba atualizações importantes por email</div>
            </div>
            <Button
              variant={notifications.email ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
            >
              {notifications.email ? 'Ativado' : 'Desativado'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Notificações Push</div>
              <div className="text-sm text-muted-foreground">Receba notificações no navegador</div>
            </div>
            <Button
              variant={notifications.push ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications({ ...notifications, push: !notifications.push })}
            >
              {notifications.push ? 'Ativado' : 'Desativado'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Alertas de Orçamento</div>
              <div className="text-sm text-muted-foreground">Seja notificado quando atingir 80% do orçamento</div>
            </div>
            <Button
              variant={notifications.budget ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications({ ...notifications, budget: !notifications.budget })}
            >
              {notifications.budget ? 'Ativado' : 'Desativado'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Progresso de Metas</div>
              <div className="text-sm text-muted-foreground">Acompanhe o progresso das suas metas</div>
            </div>
            <Button
              variant={notifications.goals ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications({ ...notifications, goals: !notifications.goals })}
            >
              {notifications.goals ? 'Ativado' : 'Desativado'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium">Insights Inteligentes</div>
              <div className="text-sm text-muted-foreground">Receba dicas personalizadas sobre suas finanças</div>
            </div>
            <Button
              variant={notifications.insights ? "default" : "outline"}
              size="sm"
              onClick={() => setNotifications({ ...notifications, insights: !notifications.insights })}
            >
              {notifications.insights ? 'Ativado' : 'Desativado'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>Escolha o tema de cores da aplicação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-6 w-6" />
              <span>Claro</span>
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-6 w-6" />
              <span>Escuro</span>
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => setTheme('system')}
            >
              <Monitor className="h-6 w-6" />
              <span>Sistema</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categorias de Despesas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Categorias de Despesas
            </CardTitle>
            <CardDescription>Gerencie suas categorias de gastos e defina limites de orçamento</CardDescription>
          </div>
          <Button 
            onClick={() => { 
              setNewCategory({ ...newCategory, type: 'expense' }); 
              setShowAddModal(true); 
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {expenseCategories.map(category => (
              <motion.div
                key={category.id}
                layout
                className="p-4 border rounded-lg space-y-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{category.icon}</span>
                    {editingCategory === category.id ? (
                      <Input
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span className="font-medium">{category.name}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {editingCategory === category.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600"
                          onClick={() => handleSaveEdit(category.id)}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingCategory(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {editingCategory === category.id ? (
                  <div>
                    <label className="text-xs text-muted-foreground">Limite mensal</label>
                    <Input
                      type="number"
                      value={editValues.budgetLimit}
                      onChange={(e) => setEditValues({ ...editValues, budgetLimit: Number(e.target.value) })}
                      className="h-8 mt-1"
                      placeholder="R$ 0"
                    />
                  </div>
                ) : category.budgetLimit ? (
                  <div className="text-sm text-muted-foreground">
                    Limite: {category.budgetLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Sem limite definido</div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categorias de Receitas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Categorias de Receitas
            </CardTitle>
            <CardDescription>Gerencie suas categorias de ganhos e fontes de renda</CardDescription>
          </div>
          <Button 
            onClick={() => { 
              setNewCategory({ ...newCategory, type: 'income' }); 
              setShowAddModal(true); 
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {incomeCategories.map(category => (
              <motion.div
                key={category.id}
                layout
                className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{category.icon}</span>
                    {editingCategory === category.id ? (
                      <Input
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <span className="font-medium">{category.name}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {editingCategory === category.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600"
                          onClick={() => handleSaveEdit(category.id)}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingCategory(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal Adicionar Categoria */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-lg p-6 w-full max-w-md border shadow-xl"
            >
              <h3 className="text-xl font-bold mb-4">Nova Categoria</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome da Categoria</label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Ex: Pets, Vestuário, Investimentos..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ícone (Emoji)</label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewCategory({ ...newCategory, icon })}
                        className={`text-2xl p-2 rounded hover:bg-accent transition-colors ${newCategory.icon === icon ? 'bg-primary/20 ring-2 ring-primary' : ''}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                {newCategory.type === 'expense' && (
                  <div>
                    <label className="text-sm font-medium">Limite Mensal (opcional)</label>
                    <Input
                      type="number"
                      value={newCategory.budgetLimit}
                      onChange={(e) => setNewCategory({ ...newCategory, budgetLimit: Number(e.target.value) })}
                      placeholder="R$ 0"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Defina um limite de gastos mensal para esta categoria
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleAddCategory}
                    disabled={!newCategory.name.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dados e Privacidade */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Dados e Privacidade
          </CardTitle>
          <CardDescription>Gerencie seus dados e configurações de privacidade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Exportar Dados</h3>
            <p className="text-sm text-muted-foreground">
              Baixe uma cópia de todos os seus dados financeiros
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {/* Ainda não implementado: desabilitado para não parecer que exportou */}
              <Button variant="outline" disabled className="gap-2">
                <Download className="w-4 h-4" />
                Exportar JSON
              </Button>
              <Button variant="outline" disabled className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
              <span className="text-xs text-muted-foreground">Em breve</span>
            </div>
          </div>

          <div className="h-px bg-border my-6" />

          <div className="space-y-2">
            <h3 className="font-medium text-destructive">Zona de Perigo</h3>
            <p className="text-sm text-muted-foreground">
              Ações irreversíveis que afetam permanentemente sua conta
            </p>
            {/* Ainda não implementado: desabilitado para não parecer que a conta foi excluída */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="destructive" disabled className="gap-2">
                <Trash2 className="w-4 h-4" />
                Excluir Conta Permanentemente
              </Button>
              <span className="text-xs text-muted-foreground">Em breve</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
