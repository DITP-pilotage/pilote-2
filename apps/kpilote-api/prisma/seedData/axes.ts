// Axes de démonstration (multifiltre, cf.
// docs/superpowers/specs/2026-11-12-kpilote-multifiltre-axes-design.md §4).
// Aucun indicateur ne les déclare encore : ils servent de référentiel aux
// pages et routes des axes.
//
// Les niveaux sont listés du plus large au plus fin ; leur ordre commence à 1.
// Le parent d'une modalité appartient au niveau précédent du même axe.

// La profondeur d'une modalité dans l'arbre donne son niveau.
export type ModaliteSeed = {
  publicId: string
  nom: string
  enfants?: ReadonlyArray<ModaliteSeed>
}

export const axesSeed: ReadonlyArray<{
  publicId: string
  nom: string
  description: string
  niveaux: ReadonlyArray<string>
  modalites: ReadonlyArray<ModaliteSeed>
}> = [
  {
    publicId: 'AXE-OPERATEUR',
    nom: 'Opérateur',
    description: 'Opérateurs commerciaux de réseau fibre (FttH).',
    niveaux: ['Opérateur'],
    modalites: [
      { publicId: 'OP-ORANGE', nom: 'Orange' },
      { publicId: 'OP-SFR', nom: 'SFR' },
      { publicId: 'OP-FREE', nom: 'Free' },
      { publicId: 'OP-BOUYGUES', nom: 'Bouygues Telecom' },
    ],
  },
  {
    publicId: 'AXE-FRAUDE',
    nom: 'Type de fraude',
    description: 'Familles de fraude et leurs types.',
    niveaux: ['Famille', 'Type'],
    modalites: [
      {
        publicId: 'FR-FISCALE',
        nom: 'Fraude fiscale',
        enfants: [
          { publicId: 'FR-TVA', nom: 'Fraude à la TVA' },
          { publicId: 'FR-IR', nom: "Fraude à l'impôt sur le revenu" },
          { publicId: 'FR-IS', nom: "Fraude à l'impôt sur les sociétés" },
        ],
      },
      {
        publicId: 'FR-SOCIALE',
        nom: 'Fraude sociale',
        enfants: [
          { publicId: 'FR-COTISATIONS', nom: 'Fraude aux cotisations' },
          { publicId: 'FR-PRESTATIONS', nom: 'Fraude aux prestations' },
        ],
      },
    ],
  },
]
