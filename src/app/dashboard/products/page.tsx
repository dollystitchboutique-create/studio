
"use client";

import { useState } from 'react';
import { INITIAL_PRODUCTS } from '@/lib/mock-data';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Trash2, 
  Image as ImageIcon,
  Tag as TagIcon,
  Palette,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProductCatalogue() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // New product form state
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'Necklace',
    spec: '',
    color: '',
    price: '',
    description: '',
    sku: '',
  });

  const filteredProducts = products.filter(p => 
    !p.isDeleted && 
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const generateSku = () => {
    const prefix = newProd.category.substring(0, 2).toUpperCase();
    const colorCode = newProd.color.substring(0, 3).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    const sku = `${prefix}-${colorCode}-${rand}`;
    setNewProd({ ...newProd, sku });
  };

  const handleAddProduct = () => {
    const prod: Product = {
      id: Date.now().toString(),
      sku: newProd.sku,
      name: newProd.name,
      category: newProd.category,
      spec: newProd.spec,
      color: newProd.color,
      price: parseFloat(newProd.price),
      description: newProd.description,
      imageUrl: 'https://picsum.photos/seed/' + Date.now() + '/600/400',
      isDeleted: false,
    };
    setProducts([...products, prod]);
    setIsAdding(false);
    setNewProd({ name: '', category: 'Necklace', spec: '', color: '', price: '', description: '', sku: '' });
  };

  const softDelete = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, isDeleted: true } : p));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-headline text-primary">Product Catalogue</h2>
          <p className="text-muted-foreground mt-1">Manage your jewelry inventory and SKUs.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-secondary">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-primary">Add New Jewelry Piece</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} placeholder="e.g. Sapphire Dream" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newProd.category} 
                  onChange={e => setNewProd({...newProd, category: e.target.value})}
                >
                  <option>Necklace</option>
                  <option>Earrings</option>
                  <option>Bracelet</option>
                  <option>Ring</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Color / Material</Label>
                <Input value={newProd.color} onChange={e => setNewProd({...newProd, color: e.target.value})} placeholder="e.g. Gold / Silver" />
              </div>
              <div className="space-y-2">
                <Label>Specification</Label>
                <Input value={newProd.spec} onChange={e => setNewProd({...newProd, spec: e.target.value})} placeholder="e.g. 18k Plated" />
              </div>
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="number" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>SKU (Auto-suggested)</Label>
                <div className="flex gap-2">
                  <Input value={newProd.sku} onChange={e => setNewProd({...newProd, sku: e.target.value})} placeholder="SKU-XXXX" />
                  <Button variant="outline" size="sm" onClick={generateSku}>Generate</Button>
                </div>
              </div>
              <div className="col-span-full space-y-2">
                <Label>Description</Label>
                <Textarea value={newProd.description} onChange={e => setNewProd({...newProd, description: e.target.value})} placeholder="Describe this masterpiece..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button className="bg-primary" onClick={handleAddProduct}>Save Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          className="pl-10 rounded-full border-primary/20 bg-white" 
          placeholder="Search name or SKU..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p) => (
          <Card key={p.id} className="group overflow-hidden border-primary/10 bg-white transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="aspect-[4/3] bg-muted relative overflow-hidden">
              <img 
                src={p.imageUrl} 
                alt={p.name} 
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
              <Badge className="absolute top-3 right-3 bg-white/90 text-primary hover:bg-white">{p.category}</Badge>
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="font-headline text-xl text-primary">{p.name}</CardTitle>
                <span className="text-xl font-bold text-secondary">${p.price.toFixed(2)}</span>
              </div>
              <p className="text-xs font-mono text-muted-foreground bg-primary/5 inline-block px-2 py-1 rounded">{p.sku}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Palette size={12} /> {p.color}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Info size={12} /> {p.spec}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 flex justify-between">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-destructive"
                onClick={() => softDelete(p.id)}
              >
                <Trash2 size={16} className="mr-1" /> Remove
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-primary/10">
          <ImageIcon className="mx-auto w-12 h-12 text-primary/20 mb-4" />
          <h3 className="text-xl font-headline text-primary/40">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or add a new item.</p>
        </div>
      )}
    </div>
  );
}
