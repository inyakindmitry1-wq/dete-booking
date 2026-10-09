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
