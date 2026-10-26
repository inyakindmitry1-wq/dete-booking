import React, { useState } from 'react';
import { DbTenant } from '@/types/database';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface AIChatWidgetProps {
  tenant: DbTenant;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({ tenant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Здравствуйте! Я онлайн-помощник ${tenant.name}. Могу подсказать по услугам, ценам или свободным окнам для записи. Чем могу помочь?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  async function handleSendMessage(textToSend?: string) {
    const text = textToSend || inputText.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Simulate/call Edge Function ai-chat
      // With local tool resolution fallback
      const lower = text.toLowerCase();
      let reply = '';

      if (lower.includes('цена') || lower.includes('стоимость') || lower.includes('сколько стоит')) {
        const services = await api.getServices(tenant.id);
        const match = services.find((s) => lower.includes(s.name.toLowerCase().split(' ')[0]));
        if (match) {
          reply = `Стоимость услуги "${match.name}" составляет от ${match.price.toLocaleString('ru-RU')} ₽, примерная длительность ${match.duration_minutes} мин.`;
        } else {
          reply = `У нас представлены ${services.length} услуг: от ${Math.min(...services.map((s) => s.price)).toLocaleString('ru-RU')} ₽ до ${Math.max(...services.map((s) => s.price)).toLocaleString('ru-RU')} ₽. Выберите интересующую услугу в каталоге выше!`;
        }
      } else if (lower.includes('где') || lower.includes('адрес') || lower.includes('как доехать')) {
        reply = `Мы находимся по адресу: ${tenant.city}, ${tenant.address}. Телефон для связи: ${tenant.phone}.`;
      } else if (lower.includes('окно') || lower.includes('свободн') || lower.includes('когда') || lower.includes('записат')) {
        reply = `Чтобы выбрать точное свободное окно на подходящий пост, нажмите кнопку «Записаться» у нужной услуги в списке, и откроется расписание свободных мест в реальном времени!`;
      } else {
        reply = `Я готов ответить на ваши вопросы об услугах студии ${tenant.name}. Вы также можете нажать «Записаться» на любой карточке услуги, чтобы сразу забронировать удобное время.`;
      }

      // Small natural delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Fallback per invariant 12: Normal booking continues even if AI fails
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Извините, сервис онлайн-консультанта сейчас перезагружается. Вы можете воспользоваться стандартной онлайн-записью через каталог услуг.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  const quickPrompts = [
    'Сколько стоит полировка?',
    'Где вы находитесь?',
    'Свободные окна на сегодня',
  ];

  return (
    <>
      {/* Hidden Action Button (triggered cleanly by AI banner in home) */}
      <button
        id="ai-floating-trigger"
        onClick={() => setIsOpen(true)}
        className="hidden"
        aria-label="Онлайн помощник"
      />

      {/* Chat Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-w-md mx-auto max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5 text-white" />
              <span>AI-Консультант {tenant.name}</span>
            </DrawerTitle>
            <DrawerDescription>
              Подскажет по ценам, регламентам работ и свободному времени
            </DrawerDescription>
          </DrawerHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[380px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2.5 max-w-[85%]",
                  m.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                    m.sender === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {m.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                </div>

                <div
                  className={cn(
                    "p-3 rounded-2xl text-xs sm:text-sm leading-relaxed",
                    m.sender === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-none font-medium"
                      : "bg-secondary/70 border border-border text-foreground rounded-tl-none"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 mr-auto">
                <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-2xl bg-secondary/70 border border-border text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Помощник печатает...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Strip */}
          <div className="px-4 py-1.5 flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-secondary border border-border text-muted-foreground hover:text-foreground whitespace-nowrap active:scale-95 transition-transform"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <DrawerFooter className="pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Задайте вопрос..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="rounded-xl h-11 text-sm bg-secondary/60"
              />
              <Button type="submit" size="icon" disabled={!inputText.trim() || isTyping} className="rounded-xl shrink-0 h-11 w-11">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
