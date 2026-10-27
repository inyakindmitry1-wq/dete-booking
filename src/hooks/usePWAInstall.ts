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
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect Standalone PWA mode (already installed & opened from home screen)
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

    // If already in standalone mode, mark onboarding as completed permanently
    if (standaloneMode) {
      try {
        localStorage.setItem(`pwa_onboarding_completed_${tenantSlug}`, 'true');
      } catch {
        // ignore
      }
      return;
    }

    // 3. Listen for Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowOnboarding(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem(`pwa_onboarding_completed_${tenantSlug}`, 'true');
      } catch {
        // ignore
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 4. Check if user already saw onboarding or installed
    const storageKey = `pwa_onboarding_completed_${tenantSlug}`;
    const alreadyCompleted = localStorage.getItem(storageKey) === 'true';

    // If not standalone and hasn't seen it yet, show full-screen onboarding
    if (!alreadyCompleted) {
      setShowOnboarding(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [tenantSlug]);

  const continueInBrowser = useCallback(() => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(`pwa_onboarding_completed_${tenantSlug}`, 'true');
    } catch {
      // ignore
    }
  }, [tenantSlug]);

  const triggerNativeInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowOnboarding(false);
          try {
            localStorage.setItem(`pwa_onboarding_completed_${tenantSlug}`, 'true');
          } catch {
            // ignore
          }
        }
      } catch {
        // fallback
      }
    }
  }, [deferredPrompt, tenantSlug]);

  const openOnboardingManually = useCallback(() => {
    setShowOnboarding(true);
  }, []);

  return {
    isStandalone,
    isIOS,
    isAndroid,
    canNativeInstall: Boolean(deferredPrompt),
    showOnboarding,
    continueInBrowser,
    triggerNativeInstall,
    openOnboardingManually,
  };
}
