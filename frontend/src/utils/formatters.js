/**
 * Format ISO date string to a human-readable date.
 * Example: '2026-06-10T00:00:00.000Z' -> 'Jun 10, 2026'
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
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
 */
export const calculateLeaveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

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
