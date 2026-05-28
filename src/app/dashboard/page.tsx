"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Package, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Sale, Product } from '@/lib/types';
import { analyzeSales } from '@/ai/flows/analyze-sales-flow';

export default function InsightsDashboard() {
  const db = useFirestore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<{ summary: string, recommendation: string, topPerformer: string } | null>(null);

  const salesRef = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'sales'), where('isDeleted', '==', false));
  }, [db]);

  const productsRef = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), where('isDeleted', '==', false));
  }, [db]);

  const { data: sales, loading: salesLoading } = useCollection<Sale>(salesRef);
  const { data: products, loading: productsLoading } = useCollection<Product>(productsRef);

  const handleGetAiInsights = async () => {
    if (sales.length === 0) return;
    setIsAnalyzing(true);
    try {
      const data = sales.map(s => ({
        total: s.total,
        items: s.items.map(i => ({ name: i.name, quantity: i.quantity })),
        timestamp: s.timestamp
      }));
      const result = await analyzeSales({ salesData: data });
      setAiInsight(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Aggregate sales by category
  const categoryData = sales.reduce((acc: any[], sale) => {
    sale.items.forEach(item => {
      const prod = products.find(p => p.sku === item.sku);
      const cat = prod?.category || 'Other';
      const existing = acc.find(d => d.category === cat);
      if (existing) {
        existing.units += item.quantity;
        existing.sales += item.price * item.quantity;
      } else {
        acc.push({ category: cat, units: item.quantity, sales: item.price * item.quantity });
      }
    });
    return acc;
  }, []);

  const colors = ['#FC809F', '#E75480', '#FC809F', '#E75480'];

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalUnits = sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0);
  const avgOrder = sales.length > 0 ? totalRevenue / sales.length : 0;

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, trend: '+12.5%' },
    { label: 'Units Sold', value: totalUnits.toString(), icon: Package, trend: '+8.2%' },
    { label: 'Avg. Order', value: `$${avgOrder.toFixed(2)}`, icon: ShoppingBag, trend: '+2.1%' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-headline text-primary">Insights Dashboard</h2>
          <p className="text-muted-foreground mt-1">Real-time performance of Dollystitch Hub.</p>
        </div>
        <Button 
          onClick={handleGetAiInsights} 
          disabled={isAnalyzing || sales.length === 0}
          className="bg-primary hover:bg-secondary shadow-lg gap-2"
        >
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
          Get AI Sales Insights
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-primary/10 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Icon size={48} className="text-primary" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-muted-foreground uppercase text-xs font-bold tracking-wider">{stat.label}</CardDescription>
                <CardTitle className="text-3xl font-headline text-primary">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm font-medium text-emerald-600">
                  <TrendingUp size={16} className="mr-1" />
                  {stat.trend} <span className="text-muted-foreground ml-1 font-normal">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {aiInsight && (
        <Card className="border-primary/20 bg-primary/5 animate-in zoom-in duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary font-headline">
              <Sparkles className="h-5 w-5" /> AI Business Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase opacity-60">Performance Summary</p>
              <p className="text-sm leading-relaxed">{aiInsight.summary}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase opacity-60">Top Performer</p>
              <p className="text-sm font-bold text-secondary">{aiInsight.topPerformer}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase opacity-60">Strategic Tip</p>
              <p className="text-sm bg-white/50 p-3 rounded-lg border border-primary/10 italic">
                "{aiInsight.recommendation}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Sales by Product Type</CardTitle>
            <CardDescription>Units sold across different categories</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {salesLoading || productsLoading ? (
              <div className="h-full w-full flex items-center justify-center animate-pulse bg-primary/5 rounded-lg">
                Crunching data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.length > 0 ? categoryData : [{ category: 'No Data', units: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FFE7E9" />
                  <XAxis 
                    dataKey="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#E75480', fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#E75480', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'white'
                    }}
                  />
                  <Bar dataKey="units" radius={[10, 10, 0, 0]} barSize={40}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
