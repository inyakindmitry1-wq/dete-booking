/**
 * RFC 5545 compliant iCalendar (.ics) generation helper
 */

export interface CalendarEventParams {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  businessName: string;
}

function formatDateToICS(isoString: string): string {
  const d = new Date(isoString);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generateICS(event: CalendarEventParams): string {
  const dtStamp = formatDateToICS(new Date().toISOString());
  const dtStart = formatDateToICS(event.startTime);
  const dtEnd = formatDateToICS(event.endTime);

  const cleanDescription = event.description.replace(/\n/g, '\\n');
  const cleanLocation = event.location.replace(/\n/g, ', ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Auto Booking PWA//Detaling & Service App//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@autobooking`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title} - ${event.businessName}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Напоминание о записи через 2 часа',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(event: CalendarEventParams): void {
  const icsData = generateICS(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `booking-${event.id.slice(0, 8)}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
