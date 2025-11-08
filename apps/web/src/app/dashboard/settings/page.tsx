'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [profile, setProfile] = useState({
    name: 'Eduardo Silva',
    email: 'eduardo@example.com',
    phone: '(11) 98765-4321',
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    budget: true,
    goals: true,
    insights: true,
  });

  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Alimentação', icon: '🍔', color: '#FF6B6B', type: 'expense' },
    { id: '2', name: 'Transporte', icon: '🚗', color: '#4ECDC4', type: 'expense' },
    { id: '3', name: 'Moradia', icon: '🏠', color: '#45B7D1', type: 'expense' },
    { id: '4', name: 'Salário', icon: '💰', color: '#96CEB4', type: 'income' },
    { id: '5', name: 'Freelance', icon: '💼', color: '#FFEAA7', type: 'income' },
  ]);

  const [editingProfile, setEditingProfile] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '📌',
    color: '#9B59B6',
    type: 'expense' as 'income' | 'expense',
  });

  const handleSaveProfile = () => {
    setEditingProfile(false);
    // TODO: Save to API
  };

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const category: Category = {
        id: Date.now().toString(),
        ...newCategory,
      };
      setCategories([...categories, category]);
      setNewCategory({ name: '', icon: '📌', color: '#9B59B6', type: 'expense' });
      setShowNewCategory(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const handleExportData = (format: 'json' | 'csv') => {
    // TODO: Implement export
    console.log(`Exportando dados em formato ${format}`);
  };

  const handleDeleteAccount = () => {
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      // TODO: Implement account deletion
      console.log('Conta excluída');
    }
  };

  const iconOptions = ['📌', '🍔', '🚗', '🏠', '💰', '💼', '🎯', '🎮', '📱', '👕', '🏥', '✈️'];
  const colorOptions = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9', '#A29BFE', '#FD79A8', '#FDCB6E', '#6C5CE7'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="h-8 w-8" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas preferências e dados pessoais
          </p>
        </div>
      </div>

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil do Usuário
            </CardTitle>
            <CardDescription>Informações pessoais da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingProfile ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setEditingProfile(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{profile.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                </div>
                <Button onClick={() => setEditingProfile(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'light' ? <Sun className="h-5 w-5" /> : theme === 'dark' ? <Moon className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              Aparência
            </CardTitle>
            <CardDescription>Escolha o tema da interface</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex-1"
              >
                <Sun className="h-4 w-4 mr-2" />
                Claro
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex-1"
              >
                <Moon className="h-4 w-4 mr-2" />
                Escuro
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                className="flex-1"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Configure como deseja receber alertas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">Receber notificações por email</p>
              </div>
              <Button
                variant={notifications.email ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
              >
                {notifications.email ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push</p>
                <p className="text-sm text-muted-foreground">Notificações no navegador</p>
              </div>
              <Button
                variant={notifications.push ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNotifications({ ...notifications, push: !notifications.push })}
              >
                {notifications.push ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertas de Orçamento</p>
                <p className="text-sm text-muted-foreground">Quando ultrapassar limite</p>
              </div>
              <Button
                variant={notifications.budget ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNotifications({ ...notifications, budget: !notifications.budget })}
              >
                {notifications.budget ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Progresso de Metas</p>
                <p className="text-sm text-muted-foreground">Atualizações de objetivos</p>
              </div>
              <Button
                variant={notifications.goals ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNotifications({ ...notifications, goals: !notifications.goals })}
              >
                {notifications.goals ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Insights Financeiros</p>
                <p className="text-sm text-muted-foreground">Análises e recomendações</p>
              </div>
              <Button
                variant={notifications.insights ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNotifications({ ...notifications, insights: !notifications.insights })}
              >
                {notifications.insights ? 'Ativado' : 'Desativado'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Categories Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Gerenciar Categorias
                </CardTitle>
                <CardDescription>Personalize suas categorias de transações</CardDescription>
              </div>
              <Button onClick={() => setShowNewCategory(!showNewCategory)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showNewCategory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 border border-border rounded-lg space-y-4 bg-muted/20"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Ex: Academia"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <div className="flex gap-2">
                      <Button
                        variant={newCategory.type === 'expense' ? 'default' : 'outline'}
                        onClick={() => setNewCategory({ ...newCategory, type: 'expense' })}
                        className="flex-1"
                        size="sm"
                      >
                        Despesa
                      </Button>
                      <Button
                        variant={newCategory.type === 'income' ? 'default' : 'outline'}
                        onClick={() => setNewCategory({ ...newCategory, type: 'income' })}
                        className="flex-1"
                        size="sm"
                      >
                        Receita
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ícone</label>
                  <div className="grid grid-cols-12 gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewCategory({ ...newCategory, icon })}
                        className={`p-2 text-xl rounded border-2 transition-colors ${
                          newCategory.icon === icon
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cor</label>
                  <div className="grid grid-cols-10 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCategory({ ...newCategory, color })}
                        className={`h-8 rounded border-2 transition-all ${
                          newCategory.color === color
                            ? 'border-foreground scale-110'
                            : 'border-border hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCategory}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewCategory(false)}>
                    Cancelar
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <Badge variant={category.type === 'income' ? 'success' : 'outline'} className="text-xs">
                        {category.type === 'income' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportar Dados
            </CardTitle>
            <CardDescription>Baixe seus dados financeiros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Exporte todas as suas transações, metas e orçamentos para backup ou análise externa.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => handleExportData('json')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar JSON
              </Button>
              <Button onClick={() => handleExportData('csv')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>Ações irreversíveis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Excluir sua conta removerá permanentemente todos os seus dados. Esta ação não pode ser desfeita.
              </p>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
