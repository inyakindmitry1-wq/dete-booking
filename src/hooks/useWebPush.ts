import { useState, useEffect } from 'react';

export type PushSupportStatus =
  | 'supported'
  | 'unsupported'
  | 'ios_needs_install'
  | 'granted'
  | 'denied';

export function useWebPush() {
  const [status, setStatus] = useState<PushSupportStatus>('unsupported');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // 1. Detect iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // 2. Detect Standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as any).standalone);

    if (isIOS && !isStandalone) {
      // Invariant 10: On iOS, Push Notifications require adding app to Home Screen!
      setStatus('ios_needs_install');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }

    if (Notification.permission === 'granted') {
      setStatus('granted');
    } else if (Notification.permission === 'denied') {
      setStatus('denied');
    } else {
      setStatus('supported');
    }
  }, []);

  async function requestPushPermission(): Promise<boolean> {
    if (status === 'ios_needs_install') {
      alert('На iPhone веб-уведомления работают только после добавления приложения на экран «Домой». Нажмите «Поделиться» -> «На экран Домой».');
      return false;
    }

    if (!('Notification' in window)) return false;

    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setStatus('granted');

        // Immediately fire real native notification confirming active subscription
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              await reg.showNotification('Sokol Team Detailing', {
                body: 'Уведомления подключены! Мы напомним вам о визите и сообщим о готовности авто.',
                icon: '/icons/sokol-logo.png',
                badge: '/icons/sokol-logo.png',
              });
              return true;
            }
          }
          new Notification('Sokol Team Detailing', {
            body: 'Уведомления подключены! Мы напомним вам о визите и сообщим о готовности авто.',
            icon: '/icons/sokol-logo.png',
          });
        } catch {
          // Fallback if browser requires specific trigger
        }

        return true;
      } else {
        setStatus('denied');
        return false;
      }
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }

  return {
    status,
    isSubscribing,
    requestPushPermission,
  };
}
