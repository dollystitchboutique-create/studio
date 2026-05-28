'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // In a real development environment, this would trigger the Next.js error overlay.
      // For this prototype, we'll use a destructive toast.
      toast({
        variant: 'destructive',
        title: 'Security Rule Denied',
        description: error.message || 'You do not have permission to perform this action.',
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => errorEmitter.off('permission-error', handlePermissionError);
  }, [toast]);

  return null;
}
