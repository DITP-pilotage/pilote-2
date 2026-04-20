export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function toISODateTime(date: Date): string {
  return date.toISOString();
}
