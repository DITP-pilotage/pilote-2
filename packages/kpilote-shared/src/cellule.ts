import { z } from 'zod'

import { individuPublicIdSchema } from './publicIds'

// Identifiant public d'une cellule (point d'observation d'un indicateur) :
// publicIds de ses membres joints par `~`, au plus un par dimension. Un
// identifiant d'individu seul est une cellule à une coordonnée — c'est la
// forme historique, inchangée pour les indicateurs mono-dimension. Sur un
// indicateur multi-dimension, une dimension absente se lit « tous » (marginale).
// Cf. apps/kpilote-api/docs/architecture/dimensions-design.md.
export const SEPARATEUR_CELLULE = '~'
export const MAX_COORDONNEES_PAR_CELLULE = 5

export const parseCelluleId = (celluleId: string): string[] =>
  celluleId.split(SEPARATEUR_CELLULE).map((segment) => segment.trim())

export const formatCelluleId = (membres: ReadonlyArray<string>): string =>
  membres.join(SEPARATEUR_CELLULE)

export const celluleIdSchema = z
  .string()
  .refine(
    (value) => {
      const membres = parseCelluleId(value)
      return (
        membres.length >= 1 &&
        membres.length <= MAX_COORDONNEES_PAR_CELLULE &&
        new Set(membres).size === membres.length &&
        membres.every((membre) => individuPublicIdSchema.safeParse(membre).success)
      )
    },
    {
      message: `Identifiant de cellule attendu : 1 à ${MAX_COORDONNEES_PAR_CELLULE} identifiants d'individus distincts séparés par « ${SEPARATEUR_CELLULE} » (ex. DEPT-84 ou DEPT-84${SEPARATEUR_CELLULE}OP-ORANGE)`,
    },
  )
  .describe(
    `Identifiant de cellule : un identifiant d'individu (ex. DEPT-84), ou plusieurs membres de dimensions distinctes joints par « ${SEPARATEUR_CELLULE} » (ex. DEPT-84${SEPARATEUR_CELLULE}OP-ORANGE). Sur un indicateur multi-dimension, une dimension absente vaut « tous » (marginale).`,
  )
export type CelluleId = z.infer<typeof celluleIdSchema>

export const coordonneesSchema = z
  .array(individuPublicIdSchema)
  .min(1)
  .max(MAX_COORDONNEES_PAR_CELLULE)
  .refine((membres) => new Set(membres).size === membres.length, {
    message: 'Les membres d’une cellule doivent être distincts',
  })
  .describe(
    "Coordonnées de la cellule : un identifiant d'individu par dimension de l'indicateur, dans n'importe quel ordre.",
  )
