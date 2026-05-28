
"use client";

import { useState } from 'react';
import { INITIAL_SALES } from '@/lib/mock-data';
import { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Download, 
  Search, 
  Trash2, 
  Calendar,
  Filter,
  DollarSign
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [search, setSearch] = useState('');

  const filteredSales = sales.filter(s => 
    !s.isDeleted && 
    (s.customerName.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

  const exportCsv = () => {
    const headers = ['Sale ID', 'Customer', 'Date', 'Items', 'Total', 'Payment'];
    const rows = filteredSales.map(s => [
      s.id,
      s.customerName,
      new Date(s.timestamp).toLocaleDateString(),
      s.items.map(i => `${i.name} (x${i.quantity})`).join('; '),
      s.total.toFixed(2),
      s.paymentMethod
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const softDelete = (id: string) => {
    if(confirm('Are you sure you want to delete this sale record?')) {
      setSales(sales.map(s => s.id === id ? { ...s, isDeleted: true } : s));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-headline text-primary">Sales History</h2>
          <p className="text-muted-foreground mt-1">Detailed log of all customer transactions.</p>
        </div>
        
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/10 bg-white shadow-sm flex items-center p-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              className="pl-10 rounded-full border-primary/20" 
              placeholder="Search customers or sale IDs..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="ml-2 text-primary">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </Card>

        <Card className="bg-primary text-white border-none shadow-lg">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-bold opacity-80">Period Revenue</p>
              <h3 className="text-3xl font-headline">${totalRevenue.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="font-bold">Sale ID</TableHead>
              <TableHead className="font-bold">Customer</TableHead>
              <TableHead className="font-bold">Date & Time</TableHead>
              <TableHead className="font-bold">Items</TableHead>
              <TableHead className="font-bold text-right">Total</TableHead>
              <TableHead className="font-bold">Payment</TableHead>
              <TableHead className="font-bold text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id} className="hover:bg-primary/[0.02]">
                <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                <TableCell className="font-bold">{sale.customerName}</TableCell>
                <TableCell>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar size={14} className="mr-1" />
                    {new Date(sale.timestamp).toLocaleDateString()} {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {sale.items.map((item, idx) => (
                      <div key={idx} className="text-xs">
                        <Badge variant="secondary" className="mr-1 font-normal bg-primary/10 text-primary border-none">{item.quantity}x</Badge>
                        {item.name}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-secondary">
                  ${sale.total.toFixed(2)}
                  {sale.discount > 0 && <p className="text-[10px] text-destructive">-${sale.discount} off</p>}
                </TableCell>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-2">{sale.paymentMethod}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon" onClick={() => softDelete(sale.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredSales.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No sales records found.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
