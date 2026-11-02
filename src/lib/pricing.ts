export type VehicleCategory = 'sedan' | 'crossover' | 'suv';

export const VEHICLE_NAMES: Record<VehicleCategory, string> = {
  sedan: 'Седан',
  crossover: 'Кроссовер',
  suv: 'Внедорожник',
};

/**
 * Returns exact realistic detailing price per vehicle class
 * Class 1 (Sedan): Base price
 * Class 2 (Crossover / SUV): +20%, rounded to 500 ₽
 * Class 3 (XL / Heavy SUV): +40%, rounded to 500 ₽
 */
export function getServicePriceForClass(
  basePrice: number,
  serviceName: string,
  vehicle: VehicleCategory
): number {
  if (basePrice === 0) return 0;
  const name = serviceName.toLowerCase();

  // Free inspection / diagnostics / consultation
  if (name.includes('осмотр') || name.includes('диагностик') || name.includes('консультаци')) {
    return 0;
  }

  // Legacy preset overrides for existing demo tenants if exact basePrice matches
  if (name.includes('стандарт') && basePrice === 3900) {
    if (vehicle === 'sedan') return 3900;
    if (vehicle === 'crossover') return 4500;
    return 5200;
  }

  if (name.includes('премиум') && basePrice === 5900) {
    if (vehicle === 'sedan') return 5900;
    if (vehicle === 'crossover') return 6900;
    return 7900;
  }

  if (name.includes('восстановительная полировка') && basePrice === 18000) {
    if (vehicle === 'sedan') return 18000;
    if (vehicle === 'crossover') return 21000;
    return 25000;
  }

  if (name.includes('керамическая защита 9h') && basePrice === 32000) {
    if (vehicle === 'sedan') return 32000;
    if (vehicle === 'crossover') return 37000;
    return 43000;
  }

  if (name.includes('зоны риска') && basePrice === 75000) {
    if (vehicle === 'sedan') return 75000;
    if (vehicle === 'crossover') return 85000;
    return 95000;
  }

  if (name.includes('глубокая химчистка') && basePrice === 14000) {
    if (vehicle === 'sedan') return 14000;
    if (vehicle === 'crossover') return 16500;
    return 19000;
  }

  // Standard multi-class pricing rule:
  // Class 1 (Sedan): Base price
  // Class 2 (Crossover / SUV): +20%, rounded to 500 ₽
  // Class 3 (XL / Heavy SUV): +40%, rounded to 500 ₽
  if (vehicle === 'sedan') return basePrice;
  if (vehicle === 'crossover') return Math.round((basePrice * 1.2) / 500) * 500;
  return Math.round((basePrice * 1.4) / 500) * 500;
}
