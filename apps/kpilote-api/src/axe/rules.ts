import { err, ok, type Result } from 'neverthrow'

export type AxeUtiliseError = { type: 'AXE_UTILISE'; indicateurs: string[] }

// Un indicateur qui déclare l'axe calcule ses totaux sur ses niveaux : en
// ajouter ou en retirer changerait ses résultats. Renommer reste permis.
export const checkNombreNiveauxModifiable = ({
  nombreNiveauxActuel,
  nombreNiveauxCible,
  indicateursDeclarants,
}: {
  // null : l'axe n'existe pas encore.
  nombreNiveauxActuel: number | null
  nombreNiveauxCible: number
  indicateursDeclarants: string[]
}): Result<void, AxeUtiliseError> => {
  if (nombreNiveauxActuel === null) return ok()
  if (nombreNiveauxActuel === nombreNiveauxCible) return ok()
  if (indicateursDeclarants.length === 0) return ok()
  return err({ type: 'AXE_UTILISE', indicateurs: indicateursDeclarants })
}

export type NiveauPorteModalitesError = { type: 'NIVEAU_PORTE_MODALITES'; ordres: number[] }

// Les niveaux au-delà du nombre cible sont supprimés ; un niveau qui porte des
// modalités ne peut pas l'être.
export const checkNiveauxSupprimables = ({
  nombreNiveauxCible,
  ordresPorteursDeModalites,
}: {
  nombreNiveauxCible: number
  ordresPorteursDeModalites: number[]
}): Result<void, NiveauPorteModalitesError> => {
  const ordres = ordresPorteursDeModalites.filter((ordre) => ordre > nombreNiveauxCible)
  if (ordres.length > 0) return err({ type: 'NIVEAU_PORTE_MODALITES', ordres })
  return ok()
}
