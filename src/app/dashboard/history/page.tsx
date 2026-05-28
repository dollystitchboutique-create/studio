"use client";

import { useState } from 'react';
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
  DollarSign,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function SalesHistory() {
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const salesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'sales'), orderBy('timestamp', 'desc'));
  }, [db]);

  const { data: sales, loading } = useCollection<Sale>(salesQuery);

  const filteredSales = sales.filter(s => 
    !s.isDeleted && 
    (s.customerName.toLowerCase().includes(search.toLowerCase()) || (s.id && s.id.toLowerCase().includes(search.toLowerCase())))
  );

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

  const exportCsv = () => {
    const headers = ['Sale ID', 'Customer', 'Date', 'Items', 'Total', 'Payment'];
    const rows = filteredSales.map(s => [
      s.id,
      s.customerName,
      s.timestamp ? new Date(s.timestamp).toLocaleDateString() : 'N/A',
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
    if (!db) return;
    if(confirm('Are you sure you want to delete this sale record?')) {
      const docRef = doc(db, 'sales', id);
      updateDoc(docRef, { isDeleted: true })
        .then(() => {
          toast({ title: "Removed", description: "Sale record has been hidden." });
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `sales/${id}`,
            operation: 'update',
            requestResourceData: { isDeleted: true }
          }));
        });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-headline text-primary">Sales Log</h2>
          <p className="text-muted-foreground mt-1">Detailed log of all customer transactions.</p>
        </div>
        
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/10 bg-white shadow-sm flex items-center p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              className="pl-10 rounded-full border-primary/20" 
              placeholder="Search customers or sale IDs..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="ml-2 text-primary hidden sm:flex">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </Card>

        <Card className="bg-primary text-white border-none shadow-lg overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <DollarSign size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold opacity-80 leading-none mb-1">Period Revenue</p>
              <h3 className="text-2xl font-headline truncate leading-tight">${totalRevenue.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center animate-pulse">Loading records...</div>
        ) : (
          <Table>
            <TableHeader className="bg-primary/5">
              <TableRow>
                <TableHead className="font-bold text-xs w-[80px]">ID</TableHead>
                <TableHead className="font-bold text-xs">Customer</TableHead>
                <TableHead className="font-bold text-xs">Date & Time</TableHead>
                <TableHead className="font-bold text-xs">Items</TableHead>
                <TableHead className="font-bold text-xs text-right">Total</TableHead>
                <TableHead className="font-bold text-xs">Payment</TableHead>
                <TableHead className="font-bold text-xs text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-primary/[0.02]">
                  <TableCell className="font-mono text-[8px] text-muted-foreground truncate max-w-[70px]">
                    {sale.id}
                  </TableCell>
                  <TableCell className="font-bold text-sm">{sale.customerName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[10px] text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {sale.timestamp ? new Date(sale.timestamp).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="pl-4">
                        {sale.timestamp ? new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="text-[10px] flex items-center gap-1">
                          <Badge variant="secondary" className="px-1 py-0 h-4 min-w-4 justify-center text-[9px] bg-primary/10 text-primary border-none">{item.quantity}x</Badge>
                          <span className="truncate max-w-[120px]">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-secondary text-sm">
                    ${sale.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-1.5 py-0 text-[10px]">{sale.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedSale(sale)} className="h-7 w-7 text-primary hover:bg-primary/5">
                        <Eye size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => softDelete(sale.id!)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {!loading && filteredSales.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No sales records found.</p>
          </div>
        )}
      </Card>

      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="bg-white max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-primary">Transaction Receipt</DialogTitle>
            <DialogDescription>Details for Sale {selectedSale?.id}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1 py-4">
            {selectedSale && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm py-4 border-y border-dashed border-primary/20">
                  <div>
                    <p className="text-muted-foreground font-bold uppercase text-[10px]">Customer</p>
                    <p className="font-bold">{selectedSale.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground font-bold uppercase text-[10px]">Payment</p>
                    <p className="font-bold">{selectedSale.paymentMethod}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Items Ordered</p>
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-primary/10 flex justify-between items-center">
                  <span className="text-lg font-headline text-primary">Total Amount</span>
                  <span className="text-2xl font-bold text-secondary">${selectedSale.total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="pt-4 border-t mt-4">
            <Button className="w-full bg-primary" onClick={() => window.print()}>
              Print Receipt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
