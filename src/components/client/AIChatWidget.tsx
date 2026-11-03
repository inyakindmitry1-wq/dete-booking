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
import { useDemoStore, SelectedCar } from '@/context/DemoStoreContext';
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
  suggestedPrompts?: string[];
}

const CAR_CLASS_OPTIONS: Array<{
  label: string;
  car: SelectedCar;
}> = [
  {
    label: 'Седан',
    car: {
      name: 'Седан',
      category: 'sedan',
      carClass: 'class_1_sedan',
      categoryLabel: 'Седан',
    },
  },
  {
    label: 'Кроссовер',
    car: {
      name: 'Кроссовер',
      category: 'crossover',
      carClass: 'class_2_suv',
      categoryLabel: 'Кроссовер',
    },
  },
  {
    label: 'Внедорожник',
    car: {
      name: 'Внедорожник',
      category: 'suv',
      carClass: 'class_3_xl',
      categoryLabel: 'Внедорожник',
    },
  },
];

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  tenant,
  onNavigateToBookings,
}) => {
  const { studio, services, selectedCar, setSelectedCar, createAppointment } = useDemoStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Здравствуйте! Я онлайн-консультант студии ${tenant.name}.\n\nПодскажу точные цены на все услуги, свободные окна и технологию работ.\n\nНапишите марку вашего автомобиля (или выберите класс выше) — всё рассчитаю и помогу записаться!`,
      suggestedPrompts: [
        'Сколько стоит мойка?',
        'Запиши на полировку на завтра',
        'Прайс на все услуги',
        'Какие есть скидки?',
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    if (text.toLowerCase() === 'перейти в мои записи' || text.toLowerCase() === 'мои записи') {
      setIsOpen(false);
      onNavigateToBookings?.();
      return;
    }

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
        onUpdateSelectedCar: setSelectedCar,
      });

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: result.text,
        bookingCard: result.bookingCard,
        suggestedPrompts: result.suggestedPrompts,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Извините, произошла заминка. Пожалуйста, воспользуйтесь стандартной онлайн-записью в каталоге услуг или позвоните нам.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleCarClassChange(option: typeof CAR_CLASS_OPTIONS[0]) {
    setSelectedCar(option.car);
    const classNum = option.car.carClass === 'class_1_sedan' ? '1-й класс' : (option.car.carClass === 'class_2_suv' ? '2-й класс' : '3-й класс');
    const systemNotice: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'assistant',
      text: `🚗 Выбран класс: **${option.car.categoryLabel}** (${classNum}). Все расчёты ниже рассчитаны под него.`,
      suggestedPrompts: [
        'Прайс для моего авто',
        'Сколько стоит мойка?',
        'Запиши на полировку',
      ],
    };
    setMessages((prev) => [...prev, systemNotice]);
  }

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
        <DrawerContent className="max-w-md mx-auto max-h-[90vh] bg-[#0b0e14] border-t border-white/10 text-white focus:outline-none">
          <DrawerHeader className="pb-2 pt-3 border-b border-white/[0.08]">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2 text-white text-base font-bold">
                <div className="h-7 w-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Bot className="h-4 w-4" />
                </div>
                <span>AI-Консультант {tenant.name}</span>
              </DrawerTitle>
            </div>

            {/* Quick Car Class Selector Chips */}
            <div className="flex items-center justify-between gap-1.5 pt-2">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold shrink-0">
                Класс авто:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {CAR_CLASS_OPTIONS.map((opt) => {
                  const isCurrent = selectedCar.carClass === opt.car.carClass;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleCarClassChange(opt)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all active:scale-95 select-none",
                        isCurrent
                          ? "bg-[#2563eb] text-white shadow-sm shadow-blue-500/30 font-bold"
                          : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </DrawerHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[300px] max-h-[420px] scrollbar-none">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-2.5 max-w-[92%]",
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
                        : "bg-[#131722]/95 border border-white/10 text-zinc-200 rounded-tl-none"
                    )}
                  >
                    {m.text}
                  </div>

                  {/* Booking Confirmation Card */}
                  {m.bookingCard && (
                    <div className="p-3.5 rounded-2xl bg-[#0e1422] border border-emerald-500/40 text-white space-y-3 shadow-[0_4px_20px_rgba(16,185,129,0.18)] animate-in fade-in zoom-in-95 duration-200">
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

                  {/* Interactive Suggested Chips under Message */}
                  {m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggestedPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#161a26] border border-blue-500/25 text-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all active:scale-95 text-left"
                        >
                          {prompt}
                        </button>
                      ))}
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
                className="rounded-xl shrink-0 h-11 w-11 bg-[#2563eb] hover:bg-blue-500 text-white disabled:bg-zinc-800 disabled:text-zinc-500"
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
