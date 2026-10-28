import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DbTenant } from '@/types/database';
import { useOwnerAuth } from '@/hooks/useOwnerAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface OwnerLoginPageProps {
  tenant: DbTenant;
}

export const OwnerLoginPage: React.FC<OwnerLoginPageProps> = ({ tenant }) => {
  const { login } = useOwnerAuth(tenant.id);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleQuickEnter() {
    setIsLoading(true);
    try {
      await login('Владелец студии');
      window.location.reload();
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
          <h1 className="text-xl font-bold text-foreground">Кабинет владельца</h1>
          <p className="text-xs text-muted-foreground">
            {tenant.name}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            type="button"
            onClick={handleQuickEnter}
            disabled={isLoading}
            className="w-full h-11 rounded-xl font-bold shadow-md flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Войти в панель управления</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/s/${tenant.slug}/`)}
            className="w-full h-10 rounded-xl text-xs flex items-center justify-center gap-2 border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Вернуться к записи клиентов</span>
          </Button>
        </div>

        <div className="text-center text-[11px] text-muted-foreground pt-2 border-t border-border/60">
          <span>Быстрый доступ без ввода почты и пароля включен для демонстрации.</span>
        </div>
      </Card>
    </div>
  );
};
