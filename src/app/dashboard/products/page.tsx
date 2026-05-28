
"use client";

import { useState, useRef } from 'react';
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
  Palette,
  Info,
  Sparkles,
  Loader2,
  Wand2,
  Upload,
  Edit,
  Package
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { generateInspiration } from '@/ai/flows/generate-inspiration-flow';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  'arm cuff',
  'ear cuff',
  'custom',
  'keychain',
  'phone chain',
  'hair clip',
  'bracelet'
];

export default function ProductCatalogue() {
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isInspiring, setIsInspiring] = useState(false);
  const [inspirationPrompt, setInspirationPrompt] = useState('');
  const [generatedInspiration, setGeneratedInspiration] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const productsRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);

  const { data: products, loading } = useCollection<Product>(productsRef);

  const [newProd, setNewProd] = useState({
    name: '',
    category: CATEGORIES[0],
    spec: '',
    color: '',
    price: '',
    quantity: '1',
    sku: '',
    imageUrl: '',
  });

  const filteredProducts = products.filter(p => 
    !p.isDeleted && 
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const generateSku = (target: 'new' | 'edit') => {
    const context = target === 'new' ? newProd : editingProduct;
    if (!context) return;
    
    const prefix = context.category.substring(0, 2).toUpperCase();
    const colorCode = context.color.substring(0, 3).toUpperCase() || 'GEN';
    const rand = Math.floor(100 + Math.random() * 900);
    const sku = `${prefix}-${colorCode}-${rand}`;
    
    if (target === 'new') {
      setNewProd({ ...newProd, sku });
    } else if (editingProduct) {
      setEditingProduct({ ...editingProduct, sku });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'new') {
          setNewProd({ ...newProd, imageUrl: reader.result as string });
        } else if (editingProduct) {
          setEditingProduct({ ...editingProduct, imageUrl: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateInspiration = async () => {
    if (!inspirationPrompt) return;
    setIsInspiring(true);
    try {
      const result = await generateInspiration({ prompt: inspirationPrompt });
      setGeneratedInspiration(result.imageUrl);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Design Error', description: 'Could not generate design inspiration.' });
    } finally {
      setIsInspiring(false);
    }
  };

  const handleAddProduct = () => {
    if (!db) return;
    if (!newProd.sku || !newProd.name || !newProd.price) {
      toast({ variant: 'destructive', title: 'Error', description: 'SKU, Name, and Price are required.' });
      return;
    }
    
    const payload = {
      sku: newProd.sku,
      name: newProd.name,
      category: newProd.category,
      spec: newProd.spec,
      color: newProd.color,
      price: parseFloat(newProd.price) || 0,
      quantity: parseInt(newProd.quantity) || 1,
      description: '',
      imageUrl: newProd.imageUrl || `https://picsum.photos/seed/${Date.now()}/600/400`,
      isDeleted: false,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, 'products'), payload)
      .then(() => {
        toast({ title: 'Success', description: 'Product added to catalogue.' });
        setIsAdding(false);
        setNewProd({ name: '', category: CATEGORIES[0], spec: '', color: '', price: '', quantity: '1', sku: '', imageUrl: '' });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'products',
          operation: 'create',
          requestResourceData: payload
        }));
      });
  };

  const handleUpdateProduct = () => {
    if (!db || !editingProduct || !editingProduct.id) return;
    
    const docRef = doc(db, 'products', editingProduct.id);
    const updateData = {
      sku: editingProduct.sku,
      name: editingProduct.name,
      category: editingProduct.category,
      spec: editingProduct.spec,
      color: editingProduct.color,
      price: typeof editingProduct.price === 'string' ? parseFloat(editingProduct.price) : editingProduct.price,
      quantity: typeof editingProduct.quantity === 'string' ? parseInt(editingProduct.quantity) : editingProduct.quantity,
      imageUrl: editingProduct.imageUrl,
    };

    updateDoc(docRef, updateData)
      .then(() => {
        toast({ title: 'Success', description: 'Product updated.' });
        setEditingProduct(null);
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `products/${editingProduct.id}`,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  const softDelete = (id: string) => {
    if (!db) return;
    if (confirm('Are you sure you want to remove this product?')) {
      const docRef = doc(db, 'products', id);
      updateDoc(docRef, { isDeleted: true })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `products/${id}`,
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
          <h2 className="text-4xl font-headline text-primary">Product Catalogue</h2>
          <p className="text-muted-foreground mt-1">Manage your jewelry inventory and SKUs.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                <Wand2 className="mr-2 h-4 w-4" /> AI Design Lab
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-white flex flex-col max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> Design Inspiration
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Describe a new jewelry concept</Label>
                  <Input 
                    placeholder="e.g. A celestial arm cuff with moonstone and silver stars"
                    value={inspirationPrompt}
                    onChange={e => setInspirationPrompt(e.target.value)}
                  />
                </div>
                {generatedInspiration && (
                  <div className="rounded-2xl overflow-hidden border border-primary/10 aspect-video bg-muted relative">
                    <img src={generatedInspiration} alt="AI Inspiration" className="w-full h-full object-cover" />
                  </div>
                )}
                <Button 
                  className="w-full bg-primary" 
                  onClick={handleGenerateInspiration}
                  disabled={isInspiring || !inspirationPrompt}
                >
                  {isInspiring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isInspiring ? 'Designing...' : 'Imagine Design'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-secondary">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white flex flex-col max-h-[95vh]">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl text-primary">Add New Item</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="col-span-full">
                    <Label>Product Picture</Label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 border-2 border-dashed border-primary/20 rounded-2xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all overflow-hidden relative"
                    >
                      {newProd.imageUrl ? (
                        <img src={newProd.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-primary/40 mb-2" />
                          <p className="text-sm text-muted-foreground text-center px-4">Click to upload photo<br/><span className="text-xs">(Camera prompt on mobile)</span></p>
                        </>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'new')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} placeholder="e.g. Sapphire Dream" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={newProd.category} 
                      onChange={e => setNewProd({...newProd, category: e.target.value})}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
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
                    <Label>Quantity (In Stock)</Label>
                    <Input type="number" value={newProd.quantity} onChange={e => setNewProd({...newProd, quantity: e.target.value})} placeholder="1" />
                  </div>
                  <div className="space-y-2 col-span-full">
                    <Label>SKU (Auto-suggested)</Label>
                    <div className="flex gap-2">
                      <Input value={newProd.sku} onChange={e => setNewProd({...newProd, sku: e.target.value})} placeholder="SKU-XXXX" />
                      <Button variant="outline" size="sm" onClick={() => generateSku('new')}>Generate</Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button className="bg-primary" onClick={handleAddProduct}>Save Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl bg-white flex flex-col max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-primary">Edit Item</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="flex-1 overflow-y-auto px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="col-span-full">
                  <Label>Product Picture</Label>
                  <div 
                    onClick={() => editFileInputRef.current?.click()}
                    className="mt-2 border-2 border-dashed border-primary/20 rounded-2xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all overflow-hidden relative"
                  >
                    {editingProduct.imageUrl ? (
                      <img src={editingProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-primary/40 mb-2" />
                        <p className="text-sm text-muted-foreground text-center px-4">Click to change photo<br/><span className="text-xs">(Camera prompt on mobile)</span></p>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={editFileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'edit')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={editingProduct.category} 
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Color / Material</Label>
                  <Input value={editingProduct.color} onChange={e => setEditingProduct({...editingProduct, color: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Specification</Label>
                  <Input value={editingProduct.spec} onChange={e => setEditingProduct({...editingProduct, spec: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label>Quantity (In Stock)</Label>
                  <Input type="number" value={editingProduct.quantity} onChange={e => setEditingProduct({...editingProduct, quantity: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-2 col-span-full">
                  <Label>SKU</Label>
                  <div className="flex gap-2">
                    <Input value={editingProduct.sku} onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})} />
                    <Button variant="outline" size="sm" onClick={() => generateSku('edit')}>Generate</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
            <Button className="bg-primary" onClick={handleUpdateProduct}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          className="pl-10 rounded-full border-primary/20 bg-white" 
          placeholder="Search name or SKU..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Card key={i} className="h-64 animate-pulse bg-primary/5" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="group overflow-hidden border-primary/10 bg-white transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                <img 
                  src={p.imageUrl} 
                  alt={p.name} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <Badge className="absolute top-3 right-3 bg-white/90 text-primary hover:bg-white capitalize">{p.category}</Badge>
                {p.quantity <= 3 && (
                  <Badge variant="destructive" className="absolute top-3 left-3">Low Stock: {p.quantity}</Badge>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="font-headline text-xl text-primary">{p.name}</CardTitle>
                  <span className="text-xl font-bold text-secondary">${p.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs font-mono text-muted-foreground bg-primary/5 inline-block px-2 py-1 rounded">{p.sku}</p>
                  <Badge variant="outline" className="flex gap-1 items-center font-normal">
                    <Package size={12} /> {p.quantity} units
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-primary"
                  onClick={() => setEditingProduct(p)}
                >
                  <Edit size={16} className="mr-1" /> Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => softDelete(p.id!)}
                >
                  <Trash2 size={16} className="mr-1" /> Remove
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-20 bg-white/50 rounded-2xl border-2 border-dashed border-primary/10">
          <ImageIcon className="mx-auto w-12 h-12 text-primary/20 mb-4" />
          <h3 className="text-xl font-headline text-primary/40">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or add a new item.</p>
        </div>
      )}
    </div>
  );
}
