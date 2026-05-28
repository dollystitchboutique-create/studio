
"use client";

import { useState } from 'react';
import { INITIAL_PRODUCTS } from '@/lib/mock-data';
import { Product, Sale, SaleItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { 
  ScanBarcode, 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  User,
  Ticket
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function POSCheckout() {
  const [skuSearch, setSkuSearch] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customer, setCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Paylah' | 'PayNow'>('PayNow');
  const [discount, setDiscount] = useState(0);

  const products = INITIAL_PRODUCTS.filter(p => !p.isDeleted);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.sku === product.sku);
    if (existing) {
      setCart(cart.map(item => item.sku === product.sku ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { sku: product.sku, name: product.name, price: product.price, quantity: 1 }]);
    }
    setSkuSearch('');
  };

  const handleSkuSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.sku.toLowerCase() === skuSearch.toLowerCase());
    if (product) {
      addToCart(product);
    } else {
      alert('Product not found with SKU: ' + skuSearch);
    }
  };

  const updateQuantity = (sku: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.sku === sku) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (sku: string) => {
    setCart(cart.filter(item => item.sku !== sku));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const sale: Sale = {
      id: 'S' + Date.now(),
      customerName: customer || 'Guest',
      paymentMethod,
      discount,
      total,
      items: cart,
      timestamp: new Date().toISOString(),
      isDeleted: false,
    };

    console.log('Completing sale:', sale);
    alert('Sale completed successfully! Total: $' + total.toFixed(2));
    
    // Reset
    setCart([]);
    setCustomer('');
    setDiscount(0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-4xl font-headline text-primary">POS Checkout</h2>
            <p className="text-muted-foreground mt-1">Start a new transaction.</p>
          </div>
        </div>

        <Card className="border-primary/20 bg-white overflow-hidden">
          <CardHeader className="bg-primary/5 pb-6">
            <form onSubmit={handleSkuSearch} className="flex gap-2">
              <div className="relative flex-1">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <Input 
                  className="pl-10 h-12 text-lg rounded-xl border-primary/20 bg-white" 
                  placeholder="Enter or scan SKU..."
                  value={skuSearch}
                  onChange={e => setSkuSearch(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="bg-primary h-12 px-8 rounded-xl">Add Item</Button>
            </form>
          </CardHeader>
          <CardContent className="p-0">
            {cart.length > 0 ? (
              <div className="divide-y divide-primary/5">
                {cart.map((item) => (
                  <div key={item.sku} className="flex items-center justify-between p-4 md:p-6 hover:bg-primary/[0.02] transition-colors">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{item.name}</h4>
                      <p className="text-sm text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                    <div className="flex items-center gap-6">
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
                        <p className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} ea.</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.sku)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 size={18} />
                      </Button>
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

        {/* Quick select (Optional convenience) */}
        <div>
          <h3 className="font-headline text-xl text-primary mb-4 flex items-center gap-2">
            <TagIcon size={18} /> Popular Items
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {products.slice(0, 4).map(p => (
              <button 
                key={p.id}
                onClick={() => addToCart(p)}
                className="p-4 bg-white border border-primary/10 rounded-2xl text-center hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TagIcon size={20} className="text-primary" />
                </div>
                <p className="text-xs font-bold truncate">{p.name}</p>
                <p className="text-xs text-primary">${p.price}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-primary/20 shadow-xl bg-white sticky top-24">
          <CardHeader className="border-b border-primary/5">
            <CardTitle className="font-headline text-2xl text-primary">Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User size={14} className="text-primary" /> Customer Name
                </Label>
                <Input 
                  placeholder="Guest Customer" 
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Ticket size={14} className="text-primary" /> Cart Discount ($)
                </Label>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard size={14} className="text-primary" /> Payment Method
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PayNow', 'Paylah', 'Cash'] as const).map(m => (
                    <Button 
                      key={m}
                      variant={paymentMethod === m ? 'default' : 'outline'}
                      className={cn("text-xs py-1 rounded-lg h-auto", paymentMethod === m ? "bg-primary" : "")}
                      onClick={() => setPaymentMethod(m)}
                    >
                      {m}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-dashed border-primary/20 space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-primary pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button 
              className="w-full h-14 text-xl bg-primary hover:bg-secondary rounded-2xl shadow-lg transition-transform active:scale-95"
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Complete Sale
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
