import React, { useState } from 'react';
import { DbTenant } from '@/types/database';
import {
  X,
  Share2,
  PlusSquare,
  CheckCircle2,
  ArrowRight,
  Download,
  MoreVertical,
  Layers,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PWAInstallPromptProps {
  tenant: DbTenant;
  isOpen: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  canNativeInstall: boolean;
  onNativeInstall: () => void;
  onContinueInBrowser: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  tenant,
  isOpen,
  isIOS,
  isAndroid,
  canNativeInstall,
  onNativeInstall,
  onContinueInBrowser,
}) => {
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>(
    isAndroid && !isIOS ? 'android' : 'ios'
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 bg-[#09090b] text-white overflow-y-auto flex flex-col justify-between antialiased selection:bg-white/20 animate-in fade-in duration-200"
    >
      {/* Mobile-constrained centered viewport container */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between p-5 pb-8 sm:p-6 sm:pb-10 border-x border-white/[0.06]">
        
        {/* Top Header Row with Studio Identity & Skip Button */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-black border border-white/20 p-1 flex items-center justify-center shrink-0">
                {tenant.logo_url ? (
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Layers className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                {tenant.name}
              </span>
            </div>

            <button
              type="button"
              onClick={onContinueInBrowser}
              className="text-xs font-medium text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              Пропустить
            </button>
          </div>

          {/* Studio Brand Icon & Value Header */}
          <div className="text-center pt-6 pb-4 space-y-2.5">
            <div className="relative inline-block">
              <div className="h-16 w-16 rounded-2xl bg-black border border-white/20 p-2 shadow-2xl ring-1 ring-white/10 mx-auto flex items-center justify-center">
                {tenant.logo_url ? (
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Layers className="h-8 w-8 text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                <Smartphone className="h-3 w-3 text-black" />
              </div>
            </div>

            <div className="space-y-1">
              <h2
                id="onboarding-title"
                className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight"
              >
                Добавьте приложение на рабочий стол
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Быстрая запись, статус готовности автомобиля и пуш-уведомления без App Store и Google Play
              </p>
            </div>
          </div>

          {/* Clean Platform Switcher Tabs (NO EMOJIS) */}
          <div className="pt-2 pb-4">
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#14151a] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={cn(
                  "h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'ios'
                    ? "bg-white text-black shadow-md shadow-white/10"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <span>iPhone / Safari</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={cn(
                  "h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                  activeTab === 'android'
                    ? "bg-white text-black shadow-md shadow-white/10"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <span>Android / Chrome</span>
              </button>
            </div>
          </div>

          {/* Step-by-Step Interactive Instruction Cards (NO EMOJIS) */}
          <div className="space-y-2.5">
            {activeTab === 'ios' ? (
              /* iOS Safari Instructions */
              <>
                {/* Step 1 */}
                <div className="rounded-2xl border border-white/10 bg-[#12141a] p-3.5 space-y-2 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/[0.08] text-white font-black text-xs flex items-center justify-center shrink-0 border border-white/15">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-xs">
                        Нажмите кнопку «Поделиться»
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        В нижней панели браузера Safari найдите значок квадрата со стрелочкой вверх.
                      </p>
                    </div>
                  </div>

                  {/* Visual Safari Bar Simulation */}
                  <div className="rounded-xl bg-[#090a0d] border border-white/[0.08] p-2 flex items-center justify-around text-zinc-500 text-xs">
                    <span className="opacity-40">‹</span>
                    <span className="opacity-40">›</span>
                    <div className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center gap-1.5 text-xs font-semibold animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.3)]">
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Поделиться</span>
                    </div>
                    <span className="opacity-40">📖</span>
                    <span className="opacity-40">◻</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="rounded-2xl border border-white/10 bg-[#12141a] p-3.5 space-y-2 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/[0.08] text-white font-black text-xs flex items-center justify-center shrink-0 border border-white/15">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-xs">
                        Выберите «На экран «Домой»»
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        Прокрутите список действий вниз и нажмите на строку со значком плюса.
                      </p>
                    </div>
                  </div>

                  {/* Visual iOS Menu Row Simulation */}
                  <div className="rounded-xl bg-[#090a0d] border border-white/[0.08] p-2 px-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center text-white">
                        <PlusSquare className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold">На экран «Домой»</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                </div>

                {/* Step 3 */}
                <div className="rounded-2xl border border-white/10 bg-[#12141a] p-3.5 space-y-2 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/[0.08] text-white font-black text-xs flex items-center justify-center shrink-0 border border-white/15">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-xs">
                        Нажмите «Добавить» в правом верхнем углу
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        Иконка {tenant.name} появится на вашем экране для запуска в 1 касание.
                      </p>
                    </div>
                  </div>

                  {/* App Icon Result Simulation */}
                  <div className="rounded-xl bg-gradient-to-r from-zinc-900 to-black border border-white/[0.08] p-2.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-black border border-white/20 p-1 flex items-center justify-center shrink-0">
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
                        Готово к мгновенному запуску
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Android Chrome Instructions */
              <>
                {canNativeInstall && (
                  <div className="rounded-2xl border border-white/20 bg-white/[0.05] p-3.5 text-center space-y-2 mb-2">
                    <div className="text-xs font-bold text-white">
                      Браузер поддерживает прямую установку
                    </div>
                    <Button
                      type="button"
                      onClick={onNativeInstall}
                      className="w-full h-10 rounded-xl bg-white text-black font-bold text-xs shadow-md shadow-white/20"
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      Установить в 1 клик
                    </Button>
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-[#12141a] p-3.5 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/[0.08] text-white font-black text-xs flex items-center justify-center shrink-0 border border-white/15">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-xs">
                        Откройте меню Chrome
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        Нажмите на значок с тремя точками в правом верхнем углу браузера.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#090a0d] border border-white/[0.08] p-2 px-3 flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[200px]">
                      sokol-detailing...
                    </span>
                    <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center text-white">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#12141a] p-3.5 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg bg-white/[0.08] text-white font-black text-xs flex items-center justify-center shrink-0 border border-white/15">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white text-xs">
                        Выберите «Установить приложение»
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        Или «Добавить на главный экран» и подтвердите добавление.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#090a0d] border border-white/[0.08] p-2 px-3 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Download className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-semibold">Установить приложение</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom CTA Actions */}
        <div className="pt-6 space-y-2.5">
          <Button
            type="button"
            onClick={onContinueInBrowser}
            className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-200 text-black font-black text-xs tracking-wide shadow-[0_0_25px_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Продолжить в браузере</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-[11px] text-zinc-500 text-center">
            Вы всегда можете открыть эту инструкцию из шапки сайта.
          </p>
        </div>

      </div>
    </div>
  );
};
