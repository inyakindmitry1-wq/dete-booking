import React, { useState } from 'react';
import { DbTenant } from '@/types/database';
import {
  Smartphone,
  X,
  Share2,
  PlusSquare,
  CheckCircle2,
  ArrowRight,
  Download,
  Sparkles,
  Layers,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PWAInstallPromptProps {
  tenant: DbTenant;
  showPrompt: boolean;
  showGuide: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  canNativeInstall: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  onOpenGuide: () => void;
  onCloseGuide: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  tenant,
  showPrompt,
  showGuide,
  isIOS,
  isAndroid,
  canNativeInstall,
  onInstall,
  onDismiss,
  onOpenGuide,
  onCloseGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(isAndroid && !isIOS ? 'android' : 'ios');

  return (
    <>
      {/* 1. First Visit Floating Banner Prompt */}
      {showPrompt && !showGuide && (
        <div
          role="dialog"
          aria-label="Установить приложение"
          className="fixed bottom-24 inset-x-3 max-w-[410px] mx-auto z-40 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="relative rounded-3xl bg-[#121318]/95 backdrop-blur-xl border border-white/15 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
            {/* Close Button */}
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Закрыть уведомление"
              className="absolute top-3.5 right-3.5 h-7 w-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              {/* Studio Logo Icon in squircle */}
              <div className="h-12 w-12 rounded-2xl bg-black border border-white/20 p-1.5 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                {tenant.logo_url ? (
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Layers className="h-6 w-6 text-white" />
                )}
              </div>

              {/* Text content */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-primary">
                    PWA-приложение
                  </span>
                  <span className="inline-block h-1 w-1 rounded-full bg-white/40" />
                  <span className="text-[10px] text-zinc-400 font-medium">Бесплатно</span>
                </div>
                <h4 className="text-sm font-black text-white leading-tight">
                  Добавить {tenant.name} на экран
                </h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Запись в 1 клик, статус готовности авто и пуш-уведомления без App Store
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3.5 flex items-center gap-2">
              <Button
                type="button"
                onClick={onInstall}
                className="flex-1 h-10 rounded-xl bg-white hover:bg-zinc-100 text-black font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4 text-black" />
                <span>{canNativeInstall ? 'Установить в 1 клик' : 'Как установить?'}</span>
              </Button>

              <button
                type="button"
                onClick={onDismiss}
                className="h-10 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-400 hover:text-white transition-all active:scale-95"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Step-by-Step Instruction Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-[#0e1015] border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-3xl shadow-[0_-10px_60px_rgba(0,0,0,0.9)] max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
          >
            {/* Grabber Bar */}
            <div className="w-full pt-3 pb-1 flex justify-center sm:hidden">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Modal Header */}
            <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-black border border-white/15 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h3 id="pwa-guide-title" className="text-sm font-black text-white tracking-tight">
                    Установка на рабочий стол
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Интерактивная инструкция для смартфона
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCloseGuide}
                className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="px-5 pt-3 pb-1">
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900 border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveTab('ios')}
                  className={cn(
                    "h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    activeTab === 'ios'
                      ? "bg-white text-black shadow-md shadow-white/10"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <span> iPhone (Safari)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('android')}
                  className={cn(
                    "h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    activeTab === 'android'
                      ? "bg-white text-black shadow-md shadow-white/10"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <span>🤖 Android / Chrome</span>
                </button>
              </div>
            </div>

            {/* Tab Contents: Step-by-Step Interactive Cards */}
            <div className="px-5 py-3 space-y-3 overflow-y-auto flex-1">
              {activeTab === 'ios' ? (
                /* iOS Safari Walkthrough */
                <div className="space-y-3">
                  {/* Step 1 */}
                  <div className="group rounded-2xl border border-white/10 bg-[#14161d] p-3.5 space-y-2 relative overflow-hidden transition-all hover:border-white/20">
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-xl bg-white/[0.08] text-white font-extrabold text-xs flex items-center justify-center shrink-0 border border-white/15">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                          <span>Нажмите кнопку «Поделиться»</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          В нижней панели браузера Safari нажмите на значок квадрата со стрелочкой вверх.
                        </p>
                      </div>
                    </div>

                    {/* Simulated Safari Action Bar UI */}
                    <div className="mt-2 rounded-xl bg-[#0a0b0e] border border-white/[0.08] p-2.5 flex items-center justify-around text-zinc-400">
                      <div className="opacity-40 text-xs">‹</div>
                      <div className="opacity-40 text-xs">›</div>
                      {/* Highlighted Share Button */}
                      <div className="relative px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1 text-[11px] font-semibold animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.3)]">
                        <Share2 className="h-4 w-4" />
                        <span>Поделиться</span>
                      </div>
                      <div className="opacity-40 text-xs">📖</div>
                      <div className="opacity-40 text-xs">◻</div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="rounded-2xl border border-white/10 bg-[#14161d] p-3.5 space-y-2 transition-all hover:border-white/20">
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-xl bg-white/[0.08] text-white font-extrabold text-xs flex items-center justify-center shrink-0 border border-white/15">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                          <span>Выберите «На экран «Домой»»</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          Прокрутите список действий вниз и нажмите на строку со значком плюса.
                        </p>
                      </div>
                    </div>

                    {/* Simulated iOS Share Action Sheet Row */}
                    <div className="mt-2 rounded-xl bg-[#0a0b0e] border border-white/[0.08] p-2 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                          <PlusSquare className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold">На экран «Домой»</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="rounded-2xl border border-white/10 bg-[#14161d] p-3.5 space-y-2 transition-all hover:border-white/20">
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-xl bg-white/[0.08] text-white font-extrabold text-xs flex items-center justify-center shrink-0 border border-white/15">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                          <span>Нажмите «Добавить» в правом верхнем углу</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          Приложение мгновенно появится на рабочем столе как отдельная иконка.
                        </p>
                      </div>
                    </div>

                    {/* Simulated Final Result Preview */}
                    <div className="mt-2 rounded-xl bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border border-white/[0.08] p-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-black border border-white/20 p-1 flex items-center justify-center shrink-0 shadow-lg shadow-white/5">
                        <img
                          src={tenant.logo_url}
                          alt={tenant.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">Sokol Team</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        </div>
                        <span className="text-[10px] text-zinc-400 block truncate">
                          Готово к запуску в 1 касание
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android / Chrome Walkthrough */
                <div className="space-y-3">
                  {canNativeInstall && (
                    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center space-y-2">
                      <Sparkles className="h-6 w-6 text-primary mx-auto" />
                      <h4 className="text-sm font-black text-white">
                        Ваш браузер поддерживает прямую установку
                      </h4>
                      <p className="text-xs text-zinc-300">
                        Нажмите кнопку ниже, чтобы установить приложение в 1 клик
                      </p>
                      <Button
                        type="button"
                        onClick={onInstall}
                        className="w-full h-11 rounded-xl bg-white text-black font-bold text-xs shadow-lg shadow-white/20"
                      >
                        🚀 Установить приложение
                      </Button>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/10 bg-[#14161d] p-3.5 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-xl bg-white/[0.08] text-white font-extrabold text-xs flex items-center justify-center shrink-0 border border-white/15">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                          <span>Откройте меню Chrome</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          Нажмите на значок с тремя точками (⋮) в правом верхнем углу браузера.
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 rounded-xl bg-[#0a0b0e] border border-white/[0.08] p-2 flex items-center justify-between text-zinc-300">
                      <span className="text-xs font-mono text-zinc-500">https://sokol-detailing...</span>
                      <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <MoreVertical className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#14161d] p-3.5 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-xl bg-white/[0.08] text-white font-extrabold text-xs flex items-center justify-center shrink-0 border border-white/15">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                          <span>Выберите «Установить приложение»</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          Или «Добавить на главный экран» и подтвердите добавление.
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 rounded-xl bg-[#0a0b0e] border border-white/[0.08] p-2 flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-semibold">Установить приложение</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">Нажмите</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Modal CTA */}
            <div className="p-4 border-t border-white/[0.08] bg-[#0c0d12]">
              <Button
                type="button"
                onClick={onCloseGuide}
                className="w-full h-11 rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all"
              >
                Понятно, добавлю!
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
