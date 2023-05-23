export function formaterId(id: string | number, nombreZeroDebut: number = 4) {
  return id.toString().padStart(nombreZeroDebut, '0');
}
