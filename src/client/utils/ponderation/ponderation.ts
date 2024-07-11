export function convertitEnPondération(pondération: number | null | undefined) {
  if (pondération !== null && pondération !== undefined) {
    return Number.isInteger(pondération) ? pondération.toFixed(0) : pondération.toFixed(1);
  }
  
  return null;
}
