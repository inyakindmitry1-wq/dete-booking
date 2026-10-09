import { useState, useEffect } from 'react';
import { supabase, isLiveSupabaseConfigured } from '@/lib/supabase';
import { mockDb } from '@/lib/db-mock';

export function useOwnerAuth(tenantId: string | undefined) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true);
      if (isLiveSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && tenantId) {
          // Check membership
          const { data: member } = await supabase
            .from('tenant_members')
            .select('role')
            .eq('tenant_id', tenantId)
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (member) {
            setIsAuthenticated(true);
            setOwnerEmail(session.user.email || null);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } else {
        // Local mock session check
        const stored = localStorage.getItem(`owner_session_${tenantId}`);
        if (stored) {
          setIsAuthenticated(true);
          setOwnerEmail(JSON.parse(stored).email || 'owner@garage.local');
        } else {
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    }

    checkAuth();
  }, [tenantId]);

  async function login(email: string, password?: string) {
    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '',
      });
      if (error) throw error;
      return data;
    } else {
      // Local mock login for demo & tests
      const sessionData = { email, loggedAt: new Date().toISOString() };
      localStorage.setItem(`owner_session_${tenantId}`, JSON.stringify(sessionData));
      setIsAuthenticated(true);
      setOwnerEmail(email);
      return sessionData;
    }
  }

  async function logout() {
    if (isLiveSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    if (tenantId) {
      localStorage.removeItem(`owner_session_${tenantId}`);
    }

    // Invariant 6: Clear private owner cache and signal Service Worker!
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        await caches.delete('no-private-cache');
      } catch (e) {
        console.warn('Cache clear error:', e);
      }
    }
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_PRIVATE_CACHE' });
    }

    setIsAuthenticated(false);
    setOwnerEmail(null);
  }

  return {
    isAuthenticated,
    isLoading,
    ownerEmail,
    login,
    logout,
  };
}
