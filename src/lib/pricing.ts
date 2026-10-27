export type VehicleCategory = 'sedan' | 'crossover' | 'suv';

export const VEHICLE_NAMES: Record<VehicleCategory, string> = {
  sedan: 'Седан',
  crossover: 'Кроссовер',
  suv: 'Внедорожник',
};

/**
 * Returns exact realistic detailing price per vehicle class
 */
export function getServicePriceForClass(
  basePrice: number,
  serviceName: string,
  vehicle: VehicleCategory
): number {
  const name = serviceName.toLowerCase();

  // 1. Детейлинг-комплекс Стандарт
  if (name.includes('стандарт')) {
    if (vehicle === 'sedan') return 3900;
    if (vehicle === 'crossover') return 4500;
    return 5200; // suv
  }

  // 2. Детейлинг-комплекс Премиум
  if (name.includes('премиум')) {
    if (vehicle === 'sedan') return 5900;
    if (vehicle === 'crossover') return 6900;
    return 7900; // suv
  }

  // 3. Восстановительная полировка
  if (name.includes('полировка')) {
    if (vehicle === 'sedan') return 18000;
    if (vehicle === 'crossover') return 21000;
    return 25000; // suv
  }

  // 4. Керамическая защита 9H (2 слоя)
  if (name.includes('керамик')) {
    if (vehicle === 'sedan') return 32000;
    if (vehicle === 'crossover') return 37000;
    return 43000; // suv
  }

  // 5. Антигравийный комплекс (PPF зоны риска)
  if (name.includes('антигравий') || name.includes('пленк') || name.includes('ppf')) {
    if (vehicle === 'sedan') return 75000;
    if (vehicle === 'crossover') return 85000;
    return 95000; // suv
  }

  // 6. Глубокая химчистка салона
  if (name.includes('химчистк')) {
    if (vehicle === 'sedan') return 14000;
    if (vehicle === 'crossover') return 16500;
    return 19000; // suv
  }

  // Standard fallback
  if (vehicle === 'sedan') return basePrice;
  if (vehicle === 'crossover') return Math.round((basePrice * 1.15) / 100) * 100;
  return Math.round((basePrice * 1.35) / 100) * 100;
}
