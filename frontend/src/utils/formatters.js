/**
 * Format ISO date string to a human-readable date.
 * Example: '2026-06-10T00:00:00.000Z' or '2026-06-10' -> 'Jun 10, 2026'
 * Always uses UTC date parts to avoid any timezone rollback in western timezones.
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';

  // Handle YYYY-MM-DD or ISO strings without timezone shift
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    const parts = dateString.split('T')[0].split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const date = new Date(Date.UTC(year, month, day));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Calculates calendar days inclusive of both start and end dates.
 * Uses integer date parts in UTC to prevent timezone offsets.
 */
export const calculateLeaveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const startStr = typeof startDate === 'string' ? startDate : new Date(startDate).toISOString();
  const endStr = typeof endDate === 'string' ? endDate : new Date(endDate).toISOString();

  const startParts = startStr.split('T')[0].split('-').map(Number);
  const endParts = endStr.split('T')[0].split('-').map(Number);

  if (startParts.length !== 3 || endParts.length !== 3) return 0;

  const startUtc = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
  const endUtc = Date.UTC(endParts[0], endParts[1] - 1, endParts[2]);

  if (endUtc < startUtc) return 0;

  const diffMs = endUtc - startUtc;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Capitalize first letter of string.
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
