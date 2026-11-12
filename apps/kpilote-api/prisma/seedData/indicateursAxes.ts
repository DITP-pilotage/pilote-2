import { type UniteIndicateurCode } from '@pilote/kpilote-shared/indicateur'

// Indicateurs de démonstration à axes (multifiltre, cf.
// docs/superpowers/specs/2026-11-12-kpilote-multifiltre-axes-design.md). Les
// valeurs sont saisies par département et par modalité feuille ; régions et
// France se calculent (chemin 1). Comme pour seedData/geo.ts, tout est
// déterministe (aucun random) : un seed relancé ne réécrit rien.
//
// Cube creux : certaines modalités n'ont jamais de valeur dans certains
// départements (`estAbsente`), pour montrer qu'elles ne comptent pas.

export const indicateursAxesSeed: ReadonlyArray<{
  publicId: string
  nom: string
  unite: UniteIndicateurCode
  description: string
  axe: string
  // Modalités feuilles de l'axe, dans l'ordre (cf. seedData/axes.ts).
  modalites: ReadonlyArray<{ publicId: string; poids: number }>
  dates: ReadonlyArray<string>
  base: (indexDepartement: number) => number
  croissanceParDate: number
  decimales: number
}> = [
  {
    publicId: 'IND-101',
    nom: 'Lignes fibre raccordées, par opérateur',
    unite: 'VALEUR_UNITAIRE',
    description:
      'Nombre de lignes FttH raccordées, saisi par département et par opérateur. « Tous opérateurs » est la somme des opérateurs présents dans le département.',
    axe: 'AXE-OPERATEUR',
    modalites: [
      { publicId: 'OP-ORANGE', poids: 0.4 },
      { publicId: 'OP-SFR', poids: 0.25 },
      { publicId: 'OP-FREE', poids: 0.2 },
      { publicId: 'OP-BOUYGUES', poids: 0.15 },
    ],
    dates: Array.from({ length: 12 }, (_, i) => `2025-${String(i + 1).padStart(2, '0')}-01`),
    base: (indexDepartement) => 20_000 + ((indexDepartement * 7_919) % 60_000),
    croissanceParDate: 0.02,
    decimales: 0,
  },
  {
    publicId: 'IND-102',
    nom: 'Montant des fraudes détectées, par type',
    unite: 'MILLIONS_EUROS',
    description:
      'Montant des fraudes détectées, saisi par département et par type de fraude. Les familles (fiscale, sociale) et « Toutes fraudes » sont des sommes.',
    axe: 'AXE-FRAUDE',
    modalites: [
      { publicId: 'FR-TVA', poids: 0.35 },
      { publicId: 'FR-IR', poids: 0.15 },
      { publicId: 'FR-IS', poids: 0.2 },
      { publicId: 'FR-COTISATIONS', poids: 0.2 },
      { publicId: 'FR-PRESTATIONS', poids: 0.1 },
    ],
    dates: ['2025-01-01', '2025-04-01', '2025-07-01', '2025-10-01'],
    base: (indexDepartement) => 2 + ((indexDepartement * 37) % 18),
    croissanceParDate: 0.05,
    decimales: 2,
  },
]

// La première modalité est présente partout ; les autres manquent dans
// quelques départements.
const estAbsente = (indexDepartement: number, indexModalite: number): boolean =>
  indexModalite > 0 && (indexDepartement * 7 + indexModalite * 3) % 11 === 0

const arrondir = (valeur: number, decimales: number): number => {
  const facteur = 10 ** decimales
  return Math.round(valeur * facteur) / facteur
}

export const buildValeursAxes = ({
  indicateur,
  departementPublicIds,
}: {
  indicateur: (typeof indicateursAxesSeed)[number]
  departementPublicIds: ReadonlyArray<string>
}): ReadonlyArray<{
  individuPublicId: string
  modalitePublicId: string
  date: string
  valeur: number
}> =>
  departementPublicIds.flatMap((individuPublicId, indexDepartement) =>
    indicateur.modalites.flatMap(({ publicId: modalitePublicId, poids }, indexModalite) =>
      estAbsente(indexDepartement, indexModalite)
        ? []
        : indicateur.dates.map((date, indexDate) => ({
            individuPublicId,
            modalitePublicId,
            date,
            valeur: arrondir(
              indicateur.base(indexDepartement) *
                poids *
                (1 + indicateur.croissanceParDate * indexDate),
              indicateur.decimales,
            ),
          })),
    ),
  )

// Objectif de fin d'année par département, sur « Tous » : le total de l'année
// précédente augmenté de 30 %. Les régions et la France le calculent.
export const buildObjectifsAxes = ({
  indicateur,
  departementPublicIds,
}: {
  indicateur: (typeof indicateursAxesSeed)[number]
  departementPublicIds: ReadonlyArray<string>
}): ReadonlyArray<{ individuPublicId: string; dateCible: string; valeurCible: number }> =>
  departementPublicIds.map((individuPublicId, indexDepartement) => ({
    individuPublicId,
    dateCible: '2025-12-01',
    valeurCible: arrondir(indicateur.base(indexDepartement) * 1.3, indicateur.decimales),
  }))
