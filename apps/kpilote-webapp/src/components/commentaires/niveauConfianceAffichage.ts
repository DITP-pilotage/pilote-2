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
    actif: 'border-confiance-rouge bg-confiance-rouge text-white',
    inactif:
      'border-confiance-rouge-light bg-confiance-rouge-light text-confiance-rouge hover:border-confiance-rouge',
    badge: 'bg-confiance-rouge-light text-confiance-rouge',
    texte: 'text-confiance-rouge',
  },
  APPUIS_NECESSAIRE: {
    actif: 'border-confiance-orange bg-confiance-orange text-white',
    inactif:
      'border-confiance-orange-light bg-confiance-orange-light text-confiance-orange hover:border-confiance-orange',
    badge: 'bg-confiance-orange-light text-confiance-orange',
    texte: 'text-confiance-orange',
  },
  OBJECTIF_ATTEIGNABLE: {
    actif: 'border-confiance-jaune bg-confiance-jaune text-white',
    inactif:
      'border-confiance-jaune-light bg-confiance-jaune-light text-confiance-jaune hover:border-confiance-jaune',
    badge: 'bg-confiance-jaune-light text-confiance-jaune',
    texte: 'text-confiance-jaune',
  },
  OBJECTIF_SECURISE: {
    actif: 'border-confiance-vert bg-confiance-vert text-white',
    inactif:
      'border-confiance-vert-light bg-confiance-vert-light text-confiance-vert hover:border-confiance-vert',
    badge: 'bg-confiance-vert-light text-confiance-vert',
    texte: 'text-confiance-vert',
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
