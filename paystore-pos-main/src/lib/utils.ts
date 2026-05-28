import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Removes service name prefix from a string.
 * If the string starts with a service name followed by a dot (e.g., "dashboard.", "billing."),
 * removes the prefix up to and including the first dot.
 * If no prefix exists, returns the original string unchanged.
 *
 * @param str - The input string
 * @returns The string with prefix removed
 *
 * Examples:
 * - "dashboard.active tables" → "active tables"
 * - "billing.invoices" → "invoices"
 * - "reports.monthly summary" → "monthly summary"
 * - "no prefix" → "no prefix"
 */
export function removeServicePrefix(str: string): string {
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) {
    return str;
  }
  return str.slice(dotIndex + 1);
}
