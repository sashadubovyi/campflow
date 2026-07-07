/**
 * Генерація .ics (RFC 5545) чистим текстом — без залежностей.
 * Один VEVENT: назва кімнати, опис із фінального плану, локація/гео.
 */

export interface IcsEventInput {
  uid: string;
  title: string;
  description?: string;
  startsAt: Date;
  endsAt?: Date | null;
  location?: string | null;
  geo?: { latitude: number; longitude: number } | null;
}

/** Екранує текстові значення за RFC 5545 (кома, крапка з комою, бекслеш, переноси). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** UTC-формат дати: 20260707T120000Z */
function formatUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/** Фолдинг рядків до 75 октетів (продовження — CRLF + пробіл). */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  const limitFirst = 75;
  const limitNext = 74; // з урахуванням провідного пробілу
  for (const ch of line) {
    const chBytes = new TextEncoder().encode(ch).length;
    const limit = parts.length === 0 ? limitFirst : limitNext;
    if (currentBytes + chBytes > limit) {
      parts.push(current);
      current = ch;
      currentBytes = chBytes;
    } else {
      current += ch;
      currentBytes += chBytes;
    }
  }
  if (current) parts.push(current);
  return parts.join('\r\n ');
}

export function buildIcs(event: IcsEventInput): string {
  // Без явного кінця беремо +3 години — розумний дефолт для зустрічі
  const end = event.endsAt ?? new Date(event.startsAt.getTime() + 3 * 60 * 60 * 1000);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//andu//campflow//UK',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeText(event.uid)}`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(event.startsAt)}`,
    `DTEND:${formatUtc(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
  if (event.geo) {
    lines.push(`GEO:${event.geo.latitude.toFixed(6)};${event.geo.longitude.toFixed(6)}`);
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

/** Тригерить завантаження .ics файлу в браузері. */
export function downloadIcs(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
