import { describe, it, expect, vi } from 'vitest';
import { processAiMessage } from '@/services/geminiService';
import { caronePreset } from '@/studios/presets/carone';
import { SelectedCar } from '@/context/DemoStoreContext';

describe('geminiService offline engine', () => {
  const selectedCar: SelectedCar = {
    name: 'BMW 3 Series (Седан)',
    category: 'sedan',
    carClass: 'class_1_sedan',
    categoryLabel: 'Седан',
  };

  it('responds with car-specific prices when asked about price', async () => {
    const mockCreateAppointment = vi.fn();
    const result = await processAiMessage({
      userMessage: 'Сколько стоит полировка?',
      studio: caronePreset,
      services: caronePreset.services,
      selectedCar,
      createAppointment: mockCreateAppointment,
    });

    expect(result.text.toLowerCase()).toContain('полировка');
    expect(result.text).toContain('BMW 3 Series');
    expect(result.bookingCard).toBeUndefined();
    expect(mockCreateAppointment).not.toHaveBeenCalled();
    expect(result.suggestedPrompts).toBeDefined();
  });

  it('automatically recognizes car brand from user input and switches class', async () => {
    const mockCreateAppointment = vi.fn();
    const mockUpdateCar = vi.fn();

    const result = await processAiMessage({
      userMessage: 'У меня крузак 300, сколько стоит полировка?',
      studio: caronePreset,
      services: caronePreset.services,
      selectedCar,
      createAppointment: mockCreateAppointment,
      onUpdateSelectedCar: mockUpdateCar,
    });

    expect(mockUpdateCar).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'suv',
        carClass: 'class_3_xl',
      })
    );
    expect(result.text).toContain('Toyota Land Cruiser 300');
    expect(result.text).toContain('Внедорожник');
  });

  it('handles detailed ceramic questions with guarantees and suggested actions', async () => {
    const mockCreateAppointment = vi.fn();
    const result = await processAiMessage({
      userMessage: 'Что дает керамика и сколько слоев наносите?',
      studio: caronePreset,
      services: caronePreset.services,
      selectedCar,
      createAppointment: mockCreateAppointment,
    });

    expect(result.text).toContain('Керамическое покрытие 9H');
    expect(result.text).toContain('гидрофобный');
    expect(result.suggestedPrompts).toBeDefined();
  });

  it('automatically triggers createAppointment when asked to book', async () => {
    const mockCreateAppointment = vi.fn().mockResolvedValue({
      bookingId: 'test-booking-id-1234',
      accessToken: 'test-token',
      serviceName: 'Детейлинг-мойка',
      startTime: '2026-11-04T14:00:00',
      endTime: '2026-11-04T16:00:00',
      price: 3500,
      carModel: 'BMW 3 Series (Седан)',
    });

    const result = await processAiMessage({
      userMessage: 'Запиши на мойку на завтра в 14:00',
      studio: caronePreset,
      services: caronePreset.services,
      selectedCar,
      createAppointment: mockCreateAppointment,
    });

    expect(mockCreateAppointment).toHaveBeenCalled();
    expect(result.text).toContain('забронирован');
    expect(result.bookingCard).toBeDefined();
    expect(result.bookingCard?.serviceName).toBe('Детейлинг-мойка');
    expect(result.bookingCard?.timeFormatted).toBe('14:00');
  });

  it('does not assume any car brand like BMW when car is generic sedan', async () => {
    const genericCar: SelectedCar = {
      name: 'Седан',
      category: 'sedan',
      carClass: 'class_1_sedan',
      categoryLabel: 'Седан',
    };

    const result = await processAiMessage({
      userMessage: 'Сколько стоит мойка?',
      studio: caronePreset,
      services: caronePreset.services,
      selectedCar: genericCar,
      createAppointment: vi.fn(),
    });

    expect(result.text.toLowerCase()).toContain('мойка');
    expect(result.text).not.toContain('BMW');
    expect(result.text).toContain('Седан');
  });
});
