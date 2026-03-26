export function formatTime(isoString: string, format: '12h' | '24h' = '12h'): string {
  const date = new Date(isoString);
  if (format === '24h') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function getWeekDays(selectedDate: string, firstDayOfWeek: number = 1): string[] {
  const selected = new Date(selectedDate + 'T12:00:00');
  const dayOfWeek = selected.getDay();
  // How many days back to Sunday (0) or Monday (1)?
  const diff = (dayOfWeek - firstDayOfWeek + 7) % 7;
  const start = new Date(selected);
  start.setDate(start.getDate() - diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export function getDayName(dateStr: string, short = true): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: short ? 'short' : 'long' });
}

export function getDayNumber(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDate();
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function getTimeFromHour(date: string, hour: number, minute: number = 0): string {
  const d = new Date(date + 'T12:00:00');
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function getHourFromISO(isoString: string): number {
  return new Date(isoString).getHours();
}

export function getMinuteFromISO(isoString: string): number {
  return new Date(isoString).getMinutes();
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTimeRange(startISO: string, durationMinutes: number, format: '12h' | '24h' = '12h'): string {
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return `${formatTime(startISO, format)} – ${formatTime(end.toISOString(), format)}`;
}

export function snapToQuarterHour(isoString: string): string {
  const d = new Date(isoString);
  const minutes = d.getMinutes();
  const snapped = Math.round(minutes / 15) * 15;
  d.setMinutes(snapped, 0, 0);
  return d.toISOString();
}
