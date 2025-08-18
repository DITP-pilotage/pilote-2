export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}
