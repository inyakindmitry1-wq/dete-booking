import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall(tenantSlug: string = 'sokol') {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect Standalone PWA mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as any).standalone) ||
      document.referrer.includes('android-app://');

    setIsStandalone(standaloneMode);

    // 2. Detect OS
    const ua = navigator.userAgent || '';
    const iosDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const androidDevice = /Android/.test(ua);

    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);

    // If already running inside installed standalone PWA, don't show prompt
    if (standaloneMode) return;

    // 3. Listen for Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowPrompt(false);
      setShowGuide(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Check dismissal in localStorage
    const storageKey = `pwa_prompt_dismissed_${tenantSlug}`;
    const dismissedUntil = localStorage.getItem(storageKey);
    const isDismissed = dismissedUntil && Number(dismissedUntil) > Date.now();

    if (!isDismissed) {
      // Show prompt smoothly after 1.8 seconds on first visit
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1800);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [tenantSlug]);

  const dismissPrompt = useCallback((days = 7) => {
    setShowPrompt(false);
    try {
      const storageKey = `pwa_prompt_dismissed_${tenantSlug}`;
      const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem(storageKey, String(expiresAt));
    } catch {
      // ignore
    }
  }, [tenantSlug]);

  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowPrompt(false);
        }
      } catch {
        setShowGuide(true);
      }
    } else {
      // If iOS Safari or unsupported native trigger, open interactive guide
      setShowGuide(true);
    }
  }, [deferredPrompt]);

  const openGuide = useCallback(() => {
    setShowGuide(true);
  }, []);

  const closeGuide = useCallback(() => {
    setShowGuide(false);
  }, []);

  return {
    isStandalone,
    isIOS,
    isAndroid,
    canNativeInstall: Boolean(deferredPrompt),
    showPrompt,
    showGuide,
    triggerInstall,
    dismissPrompt,
    openGuide,
    closeGuide,
  };
}
