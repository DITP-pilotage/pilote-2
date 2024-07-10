export function convertitEnPondération(pondération: number | null) {
  if (pondération !== null) {
    return Number.isInteger(pondération) ? pondération.toFixed(0) : pondération.toFixed(1);
  }
  
  return null;
}
