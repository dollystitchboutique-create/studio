
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
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
import { TrendingUp, ShoppingBag, DollarSign, Package } from 'lucide-react';
import { INITIAL_SALES } from '@/lib/mock-data';

export default function InsightsDashboard() {
  // Aggregate sales by category for visualization
  const data = [
    { category: 'Necklace', units: 12, sales: 1068 },
    { category: 'Earrings', units: 25, sales: 1125 },
    { category: 'Bracelet', units: 18, sales: 1170 },
    { category: 'Rings', units: 14, sales: 980 },
  ];

  const colors = ['#FC809F', '#E75480', '#FC809F', '#E75480'];

  const stats = [
    { label: 'Total Revenue', value: '$3,485', icon: DollarSign, trend: '+12.5%' },
    { label: 'Units Sold', value: '69', icon: Package, trend: '+8.2%' },
    { label: 'Avg. Order', value: '$50.50', icon: ShoppingBag, trend: '+2.1%' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-headline text-primary">Insights Dashboard</h2>
          <p className="text-muted-foreground mt-1">Real-time performance of Dollystitch Hub.</p>
        </div>
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

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Sales by Product Type</CardTitle>
            <CardDescription>Units sold across different categories this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
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
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
