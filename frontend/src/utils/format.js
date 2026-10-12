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