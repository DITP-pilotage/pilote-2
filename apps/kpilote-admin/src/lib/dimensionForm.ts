import {
  DIMENSION_KEY_PATTERN,
  MAX_DIMENSION_SLOT,
  type AnalyticsDimension,
} from '@pilote/kpilote-shared/analytics/dimensions'

export type DimensionFormValues = { cle: string; slot: string; nom: string }

/** Raison de refuser le formulaire, ou null s'il peut être enregistré. */
export const dimensionFormError = (
  values: DimensionFormValues,
  dimensions: ReadonlyArray<AnalyticsDimension>,
  editing: string | null,
): string | null => {
  if (!DIMENSION_KEY_PATTERN.test(values.cle)) {
    return 'Clé : minuscules, chiffres et « _ », en commençant par une lettre.'
  }
  const slot = Number(values.slot)
  if (!Number.isInteger(slot) || slot < 1 || slot > MAX_DIMENSION_SLOT) {
    return `Numéro : un entier de 1 à ${MAX_DIMENSION_SLOT}.`
  }
  if (values.nom.trim().length === 0) return 'Libellé requis.'
  // L'enregistrement est un upsert : un ajout sur une clé existante l'écraserait.
  const existing = editing === null && dimensions.find((dimension) => dimension.cle === values.cle)
  if (existing) {
    return `« ${existing.cle} » est déjà associée à la dimension ${existing.slot} : modifiez-la dans le tableau.`
  }
  return null
}
