
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShoppingBag, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate secure admin check
    setTimeout(() => {
      if (email.endsWith('@dollystitch.com') || email === 'admin@test.com') {
        router.push('/dashboard');
      } else {
        alert('Access restricted to pre-approved administrator emails.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-white">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <ShoppingBag className="text-primary w-8 h-8" />
          </div>
          <CardTitle className="text-4xl font-headline text-primary">Dollystitch Hub</CardTitle>
          <CardDescription className="text-muted-foreground font-body">Admin Business Management Tool</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Administrator Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@dollystitch.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full py-6 text-lg bg-primary hover:bg-secondary transition-all" disabled={loading}>
              {loading ? "Authenticating..." : "Secure Access"}
              {!loading && <Lock className="ml-2 w-4 h-4" />}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Unauthorized access is prohibited.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
