import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'RUB'): string {
  if (currency === 'RUB') {
    return `${new Intl.NumberFormat('ru-RU').format(amount)} ₽`;
  }
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(amount);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) {
    return `${hours} ч`;
  }
  return `${hours} ч ${remaining} мин`;
}

export function assetUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') return url;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  const basePrefix = normalizedBase.replace(/^\//, '');
  if (cleanPath.startsWith(basePrefix)) {
    return `/${cleanPath}`;
  }
  return `${normalizedBase}${cleanPath}`;
}

