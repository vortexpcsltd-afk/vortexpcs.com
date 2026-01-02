/**
 * Date formatting utilities for UK format (DD/MM/YYYY)
 */

/**
 * Formats a date to UK format (DD/MM/YYYY)
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDateUK(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formats a date to UK format with time (DD/MM/YYYY HH:MM)
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date string with time
 */
export function formatDateTimeUK(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";

  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a date to UK format with month name (DD Month YYYY)
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date string with month name (e.g., "28 November 2025")
 */
export function formatDateLongUK(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats a date to UK format with short month (DD Mon YYYY)
 * @param date - Date object, ISO string, or timestamp
 * @returns Formatted date string with short month (e.g., "28 Nov 2025")
 */
export function formatDateShortUK(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid Date";

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Gets today's date in YYYY-MM-DD format (for input fields)
 * @returns Today's date string
 */
export function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Converts a date to YYYY-MM-DD format (for input fields)
 * @param date - Date object, ISO string, or timestamp
 * @returns Date string in YYYY-MM-DD format
 */
export function toISODate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  return d.toISOString().split("T")[0];
}
