import { type Vignette, type Vue } from '@pilote/kpilote-shared/assistant/vignettes'

export type ContexteVue = {
  indicateurs: ReadonlyArray<string>
  collections: ReadonlyArray<string>
  individus: ReadonlyArray<string>
  referentiels: ReadonlyArray<string>
}

// Une année ou un identifiant ne sont pas des mesures. Ce qui est proscrit, c'est un nombre
// présenté comme une valeur : suivi d'un `%`, ou d'un mot qui en fait une quantité.
const ANNEE = /^(19|20)\d{2}$/u
const NOMBRE_SUIVI = /(\d[\d\s .,]*)\s*(%|[a-zà-ÿ]{2,})/giu

/**
 * Vrai si le texte présente un nombre comme une mesure. Le paragraphe est la seule vignette
 * où le modèle écrit ; y laisser passer un chiffre reviendrait à rouvrir la porte que tout
 * le reste du design ferme.
 */
export const contientValeurChiffree = (texte: string): boolean => {
  for (const correspondance of texte.matchAll(NOMBRE_SUIVI)) {
    const nombre = (correspondance[1] ?? '').replace(/[\s ]/gu, '')
    const suite = correspondance[2] ?? ''
    if (suite === '%') return true
    if (ANNEE.test(nombre)) continue
    return true
  }
  return false
}

const referencesDeVignette = (
  vignette: Vignette,
): ReadonlyArray<{ cle: keyof ContexteVue; valeur: string; libelle: string }> => {
  const references: Array<{ cle: keyof ContexteVue; valeur: string; libelle: string }> = []
  if ('indicateurId' in vignette) {
    references.push({ cle: 'indicateurs', valeur: vignette.indicateurId, libelle: 'indicateur' })
  }
  if ('collectionId' in vignette) {
    references.push({ cle: 'collections', valeur: vignette.collectionId, libelle: 'collection' })
  }
  if ('individuId' in vignette) {
    references.push({ cle: 'individus', valeur: vignette.individuId, libelle: 'territoire' })
  }
  if ('referentielId' in vignette) {
    references.push({ cle: 'referentiels', valeur: vignette.referentielId, libelle: 'référentiel' })
  }
  return references
}

/**
 * Renvoie la liste des anomalies, vide si la vue est conforme. On les rend TOUTES : le
 * message est renvoyé au modèle, qui corrige en un tour plutôt qu'en autant de tours qu'il
 * y a de fautes.
 */
export const validerVue = (vue: Vue, contexte: ContexteVue): string[] => {
  const anomalies: string[] = []

  vue.vignettes.forEach((vignette, index) => {
    for (const reference of referencesDeVignette(vignette)) {
      if (!contexte[reference.cle].includes(reference.valeur)) {
        anomalies.push(
          `Vignette ${index + 1} : le ${reference.libelle} ${reference.valeur} ne fait pas partie du contexte fourni. Utilise uniquement les identifiants du contexte.`,
        )
      }
    }

    if (vignette.type === 'vignette_paragraphe' && contientValeurChiffree(vignette.texte)) {
      anomalies.push(
        `Vignette ${index + 1} : le paragraphe contient une valeur chiffrée. Les chiffres sont affichés par les autres vignettes, qui les lisent à la source. Reformule sans nombre.`,
      )
    }
  })

  return anomalies
}
