import { useState, useEffect } from 'react';
import { supabase, isLiveSupabaseConfigured } from '@/lib/supabase';

export function useOwnerAuth(tenantId: string | undefined) {
  // Free immediate entry to the owner dashboard without email/password as requested
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>('Владелец студии');

  useEffect(() => {
    // Keep owner logged in by default without credentials
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [tenantId]);

  async function login(email?: string, _password?: string) {
    setIsAuthenticated(true);
    setOwnerEmail(email || 'Владелец студии');
    return { email: email || 'Владелец студии' };
  }

  async function logout() {
    if (isLiveSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    if (tenantId) {
      localStorage.removeItem(`owner_session_${tenantId}`);
    }

    // Keep accessible without password
    setIsAuthenticated(true);
  }

  return {
    isAuthenticated,
    isLoading,
    ownerEmail,
    login,
    logout,
  };
}
