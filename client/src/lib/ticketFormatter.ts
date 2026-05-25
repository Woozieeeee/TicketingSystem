/**
 * Format ticket number for display
 * @param num - The ticket number
 * @returns Formatted string like "Ticket #0001"
 */
export const formatTicketNumber = (num: number): string => {
  return `Ticket #${String(num).padStart(4, "0")}`;
};

/**
 * Parse ticket number from search input
 * Handles formats like "Ticket #0001", "#0001", "0001", or just "1"
 * @param input - User search input
 * @returns The numeric ticket number or null if invalid
 */
export const parseTicketNumber = (input: string): number | null => {
  // Remove "Ticket #" prefix if present
  const cleaned = input.replace(/^Ticket #/i, "").replace(/^#/, "").trim();
  
  // Parse as number
  const num = parseInt(cleaned, 10);
  
  // Return null if NaN or invalid
  return isNaN(num) ? null : num;
};
