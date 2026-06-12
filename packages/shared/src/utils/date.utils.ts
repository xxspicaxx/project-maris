export function calculateDaysUntilDate(date: Date | string): number {
  const targetDate = typeof date === "string" ? new Date(date) : date;
  if (isNaN(targetDate.getTime())) {
    throw new Error("Invalid date provided");
  }

  // Normalize to UTC midnight to avoid timezone mismatch/daylight savings issues
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const targetUtc = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffMs = targetUtc - todayUtc;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function isExpired(date: Date | string): boolean {
  const days = calculateDaysUntilDate(date);
  return days < 0;
}

export function formatMaritime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return "";
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
