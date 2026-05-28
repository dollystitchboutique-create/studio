
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShoppingBag, Lock, UserPlus, LogIn } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !userLoading) {
      router.push('/dashboard');
    }
  }, [user, userLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: "Account created",
          description: "Welcome to Dollystitch Hub! You can now log in.",
        });
        setIsRegistering(false); // Switch to login after successful registration
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: "Logged in",
          description: "Successfully authenticated.",
        });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-headline text-2xl">Loading Dollystitch Hub...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-white">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <ShoppingBag className="text-primary w-8 h-8" />
          </div>
          <CardTitle className="text-4xl font-headline text-primary">Dollystitch Hub</CardTitle>
          <CardDescription className="text-muted-foreground font-body">
            {isRegistering ? "Register your administrator account" : "Admin Business Management Tool"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
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
              {loading ? "Processing..." : (isRegistering ? "Create Account" : "Secure Access")}
              {!loading && (isRegistering ? <UserPlus className="ml-2 w-4 h-4" /> : <Lock className="ml-2 w-4 h-4" />)}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="text-primary hover:bg-primary/5 w-full"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Already have an account? Sign In" : "Need an account? Register here"}
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
