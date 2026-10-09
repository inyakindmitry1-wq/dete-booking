import { describe, it, expect } from 'vitest';
import { generateICS } from '../../src/lib/ics';

describe('iCalendar Generator', () => {
  it('generates valid RFC 5545 calendar string', () => {
    const ics = generateICS({
      id: 'book-12345',
      title: 'Детейлинг-мойка в 3 фазы',
      description: 'Комплексный уход за автомобилем',
      location: 'ул. Автозаводская, 23, Москва',
      startTime: '2026-10-15T10:00:00.000Z',
      endTime: '2026-10-15T12:00:00.000Z',
      businessName: 'GRAPHITE Detailing',
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('SUMMARY:Детейлинг-мойка в 3 фазы - GRAPHITE Detailing');
    expect(ics).toContain('DTSTART:20261015T100000Z');
    expect(ics).toContain('DTEND:20261015T120000Z');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('END:VCALENDAR');
  });
});
