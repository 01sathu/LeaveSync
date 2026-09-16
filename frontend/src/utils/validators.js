/**
 * Basic email syntax validation
 */
export const isValidEmail = (email) => {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email.trim());
};

/**
 * Validates that end date is on or after start date
 */
export const isEndDateValid = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  return new Date(endDate) >= new Date(startDate);
};
