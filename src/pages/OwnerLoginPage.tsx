import React, { useState } from 'react';
import { DbTenant } from '@/types/database';
import { useOwnerAuth } from '@/hooks/useOwnerAuth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertTriangle, Loader2 } from 'lucide-react';

interface OwnerLoginPageProps {
  tenant: DbTenant;
}

export const OwnerLoginPage: React.FC<OwnerLoginPageProps> = ({ tenant }) => {
  const { login } = useOwnerAuth(tenant.id);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password);
      // reload or state will update
      window.location.reload();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Неверный логин или пароль, либо у вас нет доступа к этой студии.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 border border-border bg-card shadow-2xl space-y-5">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-1">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Вход для владельца</h1>
          <p className="text-xs text-muted-foreground">
            {tenant.name}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <Label htmlFor="email" className="text-xs font-semibold mb-1 block">
              Электронная почта
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="owner@detailing.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-xs font-semibold mb-1 block">
              Пароль
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full h-11 rounded-xl font-bold shadow-md mt-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Войти в панель'}
          </Button>
        </form>

        <div className="text-center text-[11px] text-muted-foreground pt-2 border-t border-border/60">
          <span>Регистрация новых учетных записей настраивается администратором системы.</span>
        </div>
      </Card>
    </div>
  );
};
