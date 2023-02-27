export type NuancierRemplissage = `#${string}` | `url(#${string})`;

export const remplissageParDéfaut: NuancierRemplissage = '#bababa';

export function estHachure(remplissage: NuancierRemplissage): boolean {
  return /url\(#.*\)/.test(remplissage);
}

export default interface Nuancier {
  déterminerRemplissage(valeur: number | string | null): NuancierRemplissage;
}
