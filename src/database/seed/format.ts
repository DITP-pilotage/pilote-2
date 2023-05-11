export function formaterId(id: string | number) {
  return id.toString().padStart(4, '0');
}
