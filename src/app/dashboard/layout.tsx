
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  ShoppingBag, 
  Tag, 
  History, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const auth = useAuth();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const navItems = [
    { name: 'Insights', href: '/dashboard', icon: BarChart3 },
    { name: 'POS Checkout', href: '/dashboard/pos', icon: ShoppingBag },
    { name: 'Catalogue', href: '/dashboard/products', icon: Tag },
    { name: 'Sales Log', href: '/dashboard/history', icon: History },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-body flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-primary/10 p-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-2xl font-headline text-primary">Dollystitch Hub</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="text-primary" /> : <Menu className="text-primary" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-0 z-40 bg-white border-r border-primary/10 transition-transform md:relative md:translate-x-0 w-64 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="hidden md:flex p-6 border-b border-primary/10">
          <h1 className="text-3xl font-headline text-primary">Dollystitch</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4 md:mt-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive 
                    ? "bg-primary text-white shadow-lg" 
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary/10">
          <Button 
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex justify-start items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
