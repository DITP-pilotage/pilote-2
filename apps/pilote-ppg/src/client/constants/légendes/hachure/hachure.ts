export const REMPLISSAGE_HACHURE = "hachures";

export function estHachure(
  remplissage: string,
): remplissage is typeof REMPLISSAGE_HACHURE {
  return remplissage === REMPLISSAGE_HACHURE;
}
