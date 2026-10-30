// '13:00' -> '1:00 PM'
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// '2026-10-03T18:04:26Z' -> 'Oct 2026
export const formatMonthYear = (iso) => new Date(iso).toLocaleDateString('en-US', {
  month: 'short',
  year: 'numeric'
});

// local Monday (00:00) of the week containing 'd'
export function startOfWeek(d) {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return monday;
}

// DAte -> "2026-10-29", using the LOCAL calendar day (not UTC)
export function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const weekdayOf = (ymd) => {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC'});
}

export const formatShortDate = (ymd) => {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'});
}

export const formatLongDate = (ymd) => {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC'
  })
}

export function addMinutes(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}