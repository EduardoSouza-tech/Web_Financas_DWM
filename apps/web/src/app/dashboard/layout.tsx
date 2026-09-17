'use client';

import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import { useProfiles } from '@/providers/profile-provider';
import { ProfileSwitcher } from '@/components/profiles/profile-switcher';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Receipt, 
  PiggyBank, 
  Target, 
  TrendingUp, 
  Settings,
  Menu,
  Moon,
  Sun,
  LogOut,
  CreditCard,
  Zap,
  TrendingDown,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transações', href: '/dashboard/transactions', icon: Receipt },
  { name: 'Orçamento', href: '/dashboard/budgets', icon: PiggyBank },
  { name: 'Metas', href: '/dashboard/goals', icon: Target },
  { name: 'Cartões', href: '/dashboard/cards', icon: CreditCard },
  { name: 'Assinaturas', href: '/dashboard/subscriptions', icon: Zap },
  { name: 'Dívidas', href: '/dashboard/debts', icon: TrendingDown },
  { name: 'Conciliação', href: '/dashboard/conciliacao', icon: FileText },
  { name: 'Previsões', href: '/dashboard/forecasts', icon: TrendingUp },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { activeProfile, activeProfileId, isFamilyView, loading: profilesLoading } = useProfiles();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sem perfil escolhido: mandar para a tela "Quem está usando?"
  const needsProfile = !authLoading && !profilesLoading && !!user && !activeProfileId;
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
    else if (needsProfile) router.replace('/profiles');
  }, [authLoading, user, needsProfile, router]);

  if (authLoading || profilesLoading || !user || !activeProfileId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const greeting = isFamilyView ? 'Finanças da família' : `Olá, ${activeProfile?.name ?? 'Usuário'}`;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow border-r border-border bg-card/50 backdrop-blur-xl px-6 pb-4 overflow-y-auto">
          <div className="flex items-center h-20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Finanças</h2>
                <p className="text-xs text-muted-foreground">Premium System</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 mt-5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 shrink-0 transition-transform group-hover:scale-110',
                      isActive && 'text-primary-foreground'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 pt-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="mr-3 h-5 w-5" />
              ) : (
                <Moon className="mr-3 h-5 w-5" />
              )}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border z-50 lg:hidden"
            >
              {/* Same content as desktop sidebar */}
              <div className="flex flex-col h-full px-6 pb-4">
                <div className="flex items-center h-20 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <PiggyBank className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Finanças</h2>
                      <p className="text-xs text-muted-foreground">Premium System</p>
                    </div>
                  </div>
                </div>

                <nav className="flex-1 space-y-2 mt-5">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className="mr-3 h-5 w-5 shrink-0" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card/50 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-muted-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-semibold truncate">
                {greeting}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <ProfileSwitcher />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <FinanceProvider>
            <motion.div
              key={activeProfileId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </FinanceProvider>
        </main>
      </div>
    </div>
  );
}
