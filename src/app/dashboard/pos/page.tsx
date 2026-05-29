"use client";

import { useState, useRef } from 'react';
import { Product, Sale, SaleItem, DiscountType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { 
  ScanBarcode, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  User,
  Ticket,
  Tag as TagIcon,
  Camera,
  Loader2,
  CheckCircle2,
  Percent,
  DollarSign,
  Search as SearchIcon
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';
import { identifyProduct } from '@/ai/flows/identify-product-flow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function POSCheckout() {
  const db = useFirestore();
  const { toast } = useToast();
  const [skuSearch, setSkuSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Paylah' | 'PayNow'>('PayNow');
  const [cartDiscount, setCartDiscount] = useState(0);
  const [cartDiscountType, setCartDiscountType] = useState<DiscountType>('amount');
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const productsRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);

  const { data: allProducts } = useCollection<Product>(productsRef);
  const products = allProducts.filter(p => !p.isDeleted);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.sku === product.sku);
    if (existing) {
      setCart(cart.map(item => item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        sku: product.sku, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        discount: 0,
        discountType: 'amount'
      }]);
    }
    setSkuSearch('');
    setNameSearch('');
  };

  const handleSkuSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.sku.toLowerCase() === skuSearch.toLowerCase());
    if (product) {
      if (product.quantity <= 0) {
        toast({ variant: 'destructive', title: 'Out of Stock', description: `${product.name} is currently out of stock.` });
        return;
      }
      addToCart(product);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Product not found.' });
    }
  };

  const handleCameraScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && products.length > 0) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setIsIdentifying(true);
        try {
          const result = await identifyProduct({
            photoDataUri: reader.result as string,
            catalog: products.map(p => ({ sku: p.sku, name: p.name, category: p.category, color: p.color }))
          });
          
          if (result.matchFound && result.sku) {
            const product = products.find(p => p.sku === result.sku);
            if (product) {
              setMatchedProduct(product);
            } else {
              toast({ variant: 'destructive', title: 'AI Identification', description: 'Matched product no longer in catalogue.' });
            }
          } else {
            toast({ variant: 'destructive', title: 'AI Identification', description: 'Could not identify product. Try manual search.' });
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to analyze photo.' });
        } finally {
          setIsIdentifying(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmMatchedProduct = () => {
    if (matchedProduct) {
      if (matchedProduct.quantity <= 0) {
        toast({ variant: 'destructive', title: 'Out of Stock', description: `${matchedProduct.name} is currently out of stock.` });
        setMatchedProduct(null);
        return;
      }
      addToCart(matchedProduct);
      setMatchedProduct(null);
      toast({ title: 'Success', description: `${matchedProduct.name} added to cart.` });
    }
  };

  const updateQuantity = (sku: string, delta: number) => {
    const product = products.find(p => p.sku === sku);
    if (!product) return;

    setCart(cart.map(item => {
      if (item.sku === sku) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > product.quantity) {
          toast({ variant: 'destructive', title: 'Limit Reached', description: `Only ${product.quantity} units available.` });
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateItemDiscount = (sku: string, value: number, type: DiscountType) => {
    setCart(cart.map(item => {
      if (item.sku === sku) {
        return { ...item, discount: value, discountType: type };
      }
      return item;
    }));
  };

  const removeFromCart = (sku: string) => {
    setCart(cart.filter(item => item.sku !== sku));
  };

  const calculateItemSubtotal = (item: SaleItem) => {
    const baseTotal = item.price * item.quantity;
    if (!item.discount) return baseTotal;
    
    if (item.discountType === 'amount') {
      return Math.max(0, baseTotal - (item.discount * item.quantity));
    } else {
      return Math.max(0, baseTotal * (1 - item.discount / 100));
    }
  };

  const subtotalBeforeCartDiscount = cart.reduce((acc, item) => acc + calculateItemSubtotal(item), 0);
  
  let totalDiscountValue = cart.reduce((acc, item) => {
    const base = item.price * item.quantity;
    return acc + (base - calculateItemSubtotal(item));
  }, 0);

  const cartDiscountValue = cartDiscountType === 'amount' 
    ? cartDiscount 
    : subtotalBeforeCartDiscount * (cartDiscount / 100);

  const total = Math.max(0, subtotalBeforeCartDiscount - cartDiscountValue);
  totalDiscountValue += cartDiscountValue;

  const handleCheckout = () => {
    if (cart.length === 0 || !db) return;
    
    const salePayload = {
      customerName: customer || 'Guest',
      paymentMethod,
      discount: cartDiscount,
      discountType: cartDiscountType,
      total,
      items: cart,
      timestamp: new Date().toISOString(),
      isDeleted: false,
    };

    addDoc(collection(db, 'sales'), salePayload)
      .then(() => {
        cart.forEach(item => {
          const product = products.find(p => p.sku === item.sku);
          if (product && product.id) {
            const productRef = doc(db, 'products', product.id);
            updateDoc(productRef, {
              quantity: Math.max(0, product.quantity - item.quantity)
            }).catch(async (err) => {
              errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: `products/${product.id}`,
                operation: 'update',
                requestResourceData: { quantity: Math.max(0, product.quantity - item.quantity) }
              }));
            });
          }
        });

        toast({ title: 'Success', description: `Sale completed! Total: $${total.toFixed(2)}` });
        setCart([]);
        setCustomer('');
        setCartDiscount(0);
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'sales',
          operation: 'create',
          requestResourceData: salePayload
        }));
      });
  };

  const filteredItems = products.filter(p => 
    p.quantity > 0 && 
    (p.name.toLowerCase().includes(nameSearch.toLowerCase()) || 
     p.sku.toLowerCase().includes(nameSearch.toLowerCase()))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-headline text-primary">Checkout</h2>
            <p className="text-muted-foreground mt-1">Add items to current cart.</p>
          </div>
          <Button 
            onClick={() => cameraInputRef.current?.click()}
            disabled={isIdentifying}
            className="bg-secondary hover:bg-primary shadow-lg gap-2 h-12 rounded-xl px-6"
          >
            {isIdentifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            Scan Visual
          </Button>
          <input 
            type="file" 
            ref={cameraInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleCameraScan}
          />
        </div>

        <Card className="border-primary/20 bg-white overflow-hidden shadow-sm">
          <CardHeader className="bg-primary/5 pb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <form onSubmit={handleSkuSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                  <Input 
                    className="pl-10 h-10 rounded-xl border-primary/20 bg-white text-sm" 
                    placeholder="Enter SKU..."
                    value={skuSearch}
                    onChange={e => setSkuSearch(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm" className="bg-primary h-10 px-4 rounded-xl">Add SKU</Button>
              </form>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                <Input 
                  className="pl-10 h-10 rounded-xl border-primary/20 bg-white text-sm" 
                  placeholder="Search by name..."
                  value={nameSearch}
                  onChange={e => setNameSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {cart.length > 0 ? (
              <div className="divide-y divide-primary/5">
                {cart.map((item) => (
                  <div key={item.sku} className="flex flex-col p-4 md:p-6 hover:bg-primary/[0.02] transition-colors gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg truncate">{item.name}</h4>
                        <p className="text-sm text-muted-foreground font-mono">{item.sku}</p>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        <div className="flex items-center bg-muted rounded-full p-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full" 
                            onClick={() => updateQuantity(item.sku, -1)}
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateQuantity(item.sku, 1)}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                        <div className="w-24 text-right">
                          <p className="font-bold text-lg">${calculateItemSubtotal(item).toFixed(2)}</p>
                          {item.discount && item.discount > 0 ? (
                            <p className="text-xs text-muted-foreground line-through">${(item.price * item.quantity).toFixed(2)}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} ea.</p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.sku)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-primary/5 p-3 rounded-xl border border-primary/10">
                      <Label className="text-xs font-bold uppercase text-primary/60 flex items-center gap-2">
                         <Ticket size={12} /> Item Discount
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          className="h-8 w-24 bg-white text-xs rounded-lg" 
                          placeholder="0.00"
                          value={item.discount || ''}
                          onChange={(e) => updateItemDiscount(item.sku, parseFloat(e.target.value) || 0, item.discountType || 'amount')}
                        />
                        <Tabs 
                          value={item.discountType} 
                          onValueChange={(v) => updateItemDiscount(item.sku, item.discount || 0, v as DiscountType)}
                        >
                          <TabsList className="h-8 p-1">
                            <TabsTrigger value="amount" className="h-6 px-2"><DollarSign size={12}/></TabsTrigger>
                            <TabsTrigger value="percent" className="h-6 px-2"><Percent size={12}/></TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <ShoppingCart className="mx-auto w-16 h-16 text-primary/10 mb-4" />
                <p className="text-lg text-muted-foreground">The cart is empty.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!matchedProduct} onOpenChange={() => setMatchedProduct(null)}>
          <DialogContent className="bg-white max-w-sm flex flex-col max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl text-primary flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" /> Piece Found
              </DialogTitle>
              <DialogDescription>AI identified this piece from catalogue:</DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4">
              {matchedProduct && (
                <div className="space-y-4">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-primary/10">
                    <img src={matchedProduct.imageUrl} alt={matchedProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-xl">{matchedProduct.name}</h3>
                    <p className="text-muted-foreground font-mono">{matchedProduct.sku}</p>
                    <p className="text-2xl font-bold text-secondary mt-2">${matchedProduct.price.toFixed(2)}</p>
                    {matchedProduct.quantity <= 0 && <Badge variant="destructive" className="mt-2">Out of Stock</Badge>}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 pt-4 border-t mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setMatchedProduct(null)}>Cancel</Button>
              <Button className="flex-1 bg-primary" onClick={confirmMatchedProduct} disabled={matchedProduct?.quantity <= 0}>Add to Cart</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <h3 className="font-headline text-xl text-primary flex items-center gap-2">
            <TagIcon size={18} /> Available Items
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.slice(0, nameSearch ? 10 : 5).map(p => (
              <button 
                key={p.id}
                onClick={() => addToCart(p)}
                className="p-3 bg-white border border-primary/10 rounded-2xl text-center hover:border-primary hover:shadow-lg transition-all overflow-hidden flex flex-col group"
              >
                <div className="w-full aspect-square bg-primary/5 rounded-xl mb-2 overflow-hidden">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-[10px] font-bold truncate mb-1">{p.name}</p>
                <p className="text-[10px] text-primary font-bold">${p.price.toFixed(2)}</p>
                <p className="text-[8px] text-muted-foreground font-mono mt-1">{p.sku}</p>
              </button>
            ))}
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-10 bg-primary/5 rounded-2xl border border-dashed border-primary/10">
              <p className="text-sm text-muted-foreground">No matching items in stock.</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-primary/20 shadow-xl bg-white sticky top-24">
          <CardHeader className="border-b border-primary/5">
            <CardTitle className="font-headline text-2xl text-primary">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                  <User size={14} className="text-primary" /> Customer Name
                </Label>
                <Input 
                  placeholder="e.g. Guest" 
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center justify-between gap-2 text-xs font-bold uppercase text-muted-foreground">
                  <span className="flex items-center gap-2"><Ticket size={14} className="text-primary" /> Cart Discount</span>
                  <Tabs value={cartDiscountType} onValueChange={(v) => setCartDiscountType(v as DiscountType)}>
                    <TabsList className="h-7 bg-primary/5 p-1">
                      <TabsTrigger value="amount" className="h-5 px-2 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">$</TabsTrigger>
                      <TabsTrigger value="percent" className="h-5 px-2 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">%</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={cartDiscount || ''}
                  onChange={e => setCartDiscount(parseFloat(e.target.value) || 0)}
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                  <CreditCard size={14} className="text-primary" /> Payment
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PayNow', 'Paylah', 'Cash'] as const).map(m => (
                    <Button 
                      key={m}
                      variant={paymentMethod === m ? 'default' : 'outline'}
                      className={cn("text-[10px] py-1 rounded-xl h-10", paymentMethod === m ? "bg-primary" : "border-primary/20 text-primary")}
                      onClick={() => setPaymentMethod(m)}
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-dashed border-primary/20 space-y-3">
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Items Subtotal</span>
                <span>${subtotalBeforeCartDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-destructive text-sm font-bold">
                <span>Total Savings</span>
                <span>-${totalDiscountValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-3xl font-bold text-primary pt-2 border-t border-primary/5">
                <span className="font-headline">Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button 
              className="w-full h-16 text-xl bg-primary hover:bg-secondary rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Finish Sale
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
