export const PALETTE_DSFR = [
  "#68A532",
  "#A558A0",
  "#417DC4",
  "#C8AA39",
  "#009081",
  "#E18B76",
  "#465F9D",
  "#C08C65",
  "#00A95F",
  "#E4794A",
  "#0078F3",
  "#D1B781",
  "#1F8D49",
  "#CE614A",
  "#009099",
  "#AEA397",
];

export function getCouleurTerritoire(index: number): string {
  return PALETTE_DSFR[index % PALETTE_DSFR.length];
}

export function getCouleurTerritoireParCode(code: string): string {
  let hash = 5381;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 33) ^ code.charCodeAt(i);
  }
  return PALETTE_DSFR[Math.abs(hash) % PALETTE_DSFR.length];
}
