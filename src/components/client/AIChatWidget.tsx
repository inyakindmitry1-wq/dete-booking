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
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  Calendar,
  Ticket,
  ArrowRight,
  Car,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoStore } from '@/context/DemoStoreContext';
import { geminiService, BookingCardData } from '@/services/geminiService';

interface AIChatWidgetProps {
  tenant: DbTenant;
  onNavigateToBookings?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  bookingCard?: BookingCardData;
}

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  tenant,
  onNavigateToBookings,
}) => {
  const { studio, services, selectedCar, createAppointment } = useDemoStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Здравствуйте! Я официальный онлайн-консультант студии ${tenant.name}.\n\nЗнаю точные цены для вашего ${selectedCar.name}, могу проконсультировать по технологиям или сразу записать в свободный бокс. Чем могу помочь?`,
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
      const result = await geminiService.processMessage({
        userMessage: text,
        studio,
        services,
        selectedCar,
        createAppointment,
      });

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: result.text,
        bookingCard: result.bookingCard,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Извините, произошла непредвиденная ошибка. Пожалуйста, воспользуйтесь стандартной онлайн-записью в каталоге услуг.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  const quickPrompts = [
    'Сколько стоит мойка?',
    'Запиши на комплекс на завтра в 14:00',
    'Прайс для моего авто',
    'Где вы находитесь?',
  ];

  return (
    <>
      {/* Hidden Action Button (triggered by AI banner on home) */}
      <button
        id="ai-floating-trigger"
        onClick={() => setIsOpen(true)}
        className="hidden"
        aria-label="Онлайн помощник"
      />

      {/* Chat Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-w-md mx-auto max-h-[88vh] bg-[#0b0e14] border-t border-white/10 text-white focus:outline-none">
          <DrawerHeader className="pb-2 pt-3 border-b border-white/[0.08]">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2 text-white text-base font-bold">
                <div className="h-7 w-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Bot className="h-4 w-4" />
                </div>
                <span>AI-Консультант {tenant.name}</span>
              </DrawerTitle>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-zinc-300 font-medium">
                <Car className="h-3 w-3 text-blue-400" />
                <span className="truncate max-w-[120px]">{selectedCar.categoryLabel}</span>
              </div>
            </div>
            <DrawerDescription className="text-xs text-zinc-400 mt-1">
              Работает локально • Подбирает цены для {selectedCar.name} • Записывает без очередей
            </DrawerDescription>
          </DrawerHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[400px] scrollbar-none">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2.5 max-w-[90%]",
                  m.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5",
                    m.sender === 'user' ? "bg-blue-600 text-white" : "bg-[#181d29] text-blue-400 border border-white/10"
                  )}
                >
                  {m.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                <div className="space-y-2 max-w-full">
                  <div
                    className={cn(
                      "p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-sm",
                      m.sender === 'user'
                        ? "bg-[#2563eb] text-white rounded-tr-none font-medium"
                        : "bg-[#131722]/90 border border-white/10 text-zinc-200 rounded-tl-none"
                    )}
                  >
                    {m.text}
                  </div>

                  {/* Booking Confirmation Card */}
                  {m.bookingCard && (
                    <div className="p-3.5 rounded-2xl bg-[#0e1422] border border-emerald-500/40 text-white space-y-3 shadow-[0_4px_20px_rgba(16,185,129,0.15)] animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Вы успешно записаны!</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">
                          №{m.bookingCard.bookingId.slice(0, 8)}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="font-extrabold text-white text-sm">
                          {m.bookingCard.serviceName}
                        </div>

                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <Calendar className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          <span>
                            {m.bookingCard.dateFormatted} в {m.bookingCard.timeFormatted}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                          <Car className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                          <span>Авто: {m.bookingCard.carModel}</span>
                        </div>

                        <div className="text-base font-black text-emerald-400 pt-1">
                          {m.bookingCard.price > 0
                            ? `${m.bookingCard.price.toLocaleString('ru-RU')} ₽`
                            : 'Бесплатно (0 ₽)'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          if (onNavigateToBookings) {
                            onNavigateToBookings();
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        <span>Перейти в мои записи</span>
                        <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 mr-auto animate-in fade-in duration-200">
                <div className="h-7 w-7 rounded-full bg-[#181d29] border border-white/10 flex items-center justify-center text-blue-400 mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-[#131722]/90 border border-white/10 text-xs flex items-center gap-2 text-zinc-400 rounded-tl-none">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                  <span>Помощник печатает...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Strip */}
          <div className="px-4 py-2 flex gap-1.5 overflow-x-auto scrollbar-none border-t border-white/[0.06]">
            {quickPrompts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-[#131722] border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 whitespace-nowrap active:scale-95 transition-all select-none"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <DrawerFooter className="pt-2 pb-5 border-t border-white/[0.06]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Спросите цену или напишите «Запиши на...»"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="rounded-xl h-11 text-xs sm:text-sm bg-[#131722] border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-blue-500"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputText.trim() || isTyping}
                className="rounded-xl shrink-0 h-11 w-11 bg-blue-600 hover:bg-blue-500 text-white disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
