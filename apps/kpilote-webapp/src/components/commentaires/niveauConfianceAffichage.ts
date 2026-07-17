import { type IndiceConfiance } from '@pilote/kpilote-shared/niveauConfiance'

export type NiveauConfianceAffichage = { indice: IndiceConfiance; label: string }

// Classes Tailwind par indice. Écrites en entier (pas de concaténation) pour
// rester détectables par le scanner de contenu de Tailwind.
//  - actif   : état sélectionné (fond foncé, texte blanc)
//  - inactif : état non sélectionné (fond clair, texte coloré)
//  - badge   : pastille de lecture seule (fond clair, texte coloré)
//  - texte   : couleur de texte seule (affichage inline)
export type CouleurIndice = {
  actif: string
  inactif: string
  badge: string
  texte: string
}

const COULEUR_PAR_INDICE: Record<IndiceConfiance, CouleurIndice> = {
  OBJECTIF_COMPROMIS: {
    actif: 'border-error bg-error text-white',
    inactif: 'border-error-tinted bg-error-tinted text-error hover:border-error',
    badge: 'bg-error-tinted text-error',
    texte: 'text-error',
  },
  APPUIS_NECESSAIRE: {
    actif: 'border-orange-terre-battue bg-orange-terre-battue text-white',
    inactif:
      'border-orange-terre-battue-tinted bg-orange-terre-battue-tinted text-orange-terre-battue hover:border-orange-terre-battue',
    badge: 'bg-orange-terre-battue-tinted text-orange-terre-battue',
    texte: 'text-orange-terre-battue',
  },
  OBJECTIF_ATTEIGNABLE: {
    actif: 'border-yellow-tournesol bg-yellow-tournesol text-white',
    inactif:
      'border-yellow-tournesol-tinted bg-yellow-tournesol-tinted text-yellow-tournesol hover:border-yellow-tournesol',
    badge: 'bg-yellow-tournesol-tinted text-yellow-tournesol',
    texte: 'text-yellow-tournesol',
  },
  OBJECTIF_SECURISE: {
    actif: 'border-success bg-success text-white',
    inactif: 'border-success-tinted bg-success-tinted text-success hover:border-success',
    badge: 'bg-success-tinted text-success',
    texte: 'text-success',
  },
}

// Libellés métier (alignés sur pilote-ppg), du plus dégradé au plus serein.
const LABEL_PAR_INDICE: Record<IndiceConfiance, string> = {
  OBJECTIF_COMPROMIS: 'Objectifs compromis',
  APPUIS_NECESSAIRE: 'Appuis nécessaires',
  OBJECTIF_ATTEIGNABLE: 'Objectifs atteignables',
  OBJECTIF_SECURISE: 'Objectifs sécurisés',
}

// Ordre d'affichage du sélecteur, du plus dégradé au plus serein.
const ORDRE_SELECTEUR: readonly IndiceConfiance[] = [
  'OBJECTIF_COMPROMIS',
  'APPUIS_NECESSAIRE',
  'OBJECTIF_ATTEIGNABLE',
  'OBJECTIF_SECURISE',
]

export const couleurIndice = (indice: IndiceConfiance): CouleurIndice => COULEUR_PAR_INDICE[indice]

export const NIVEAUX_CONFIANCE: readonly NiveauConfianceAffichage[] = ORDRE_SELECTEUR.map(
  (indice) => ({
    indice,
    label: LABEL_PAR_INDICE[indice],
  }),
)

export const niveauConfianceFromIndice = (indice: IndiceConfiance): NiveauConfianceAffichage => ({
  indice,
  label: LABEL_PAR_INDICE[indice],
})
