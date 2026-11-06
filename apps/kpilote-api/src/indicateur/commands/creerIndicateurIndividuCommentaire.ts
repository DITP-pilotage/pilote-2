import { type CreerCommentaireBody } from '@pilote/kpilote-shared/commentaire'
import { parseCelluleId } from '@pilote/kpilote-shared/cellule'
import { ResultAsync } from 'neverthrow'

import { creerCommentaire } from '@/commentaire/commands/creerCommentaire'
import { type CommentaireType } from '@/commentaire/ensureBrouillonUnique'
import { type SujetCommentaireConfig } from '@/commentaire/sujets'
import { cleCellule } from '@/dimension/cellule'
import { ensureCellules } from '@/dimension/celluleEcriture'
import { ValidationError } from '@/framework/errors/AppError'
import { type IndicateurIndividuCommentaireType } from '@/generated/prisma/enums'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import {
  ensureIndicateurWriteCommentPermission,
  withIndicateurReadPermission,
} from '@/indicateur/permissions'

// `individuId` (segment de chemin) est un identifiant de cellule : un individu
// (mono-dimension, inchangé) ou `DEPT-84~OP-ORANGE`. Un commentaire porte sur
// une cellule complète ou sur une marginale (cf. dimensions-design.md).
type Params = { indicateurId: string; individuId: string }

// Membres de la cellule : chacun doit exister (404 sinon, comme l'historique), au
// plus un par dimension. Comme l'historique, on ne vérifie pas que le membre
// appartient à un niveau déclaré de l'indicateur (incohérence connue, documentée
// dans dimensions-design.md, conservée pour ne pas changer le mono-dimension).
// Résolus avant le contrôle de permission (ordre historique : 404 puis 403) ;
// la cellule n'est créée qu'ensuite.
const resoudreCelluleCommentaire = async (celluleId: string) => {
  const publicIds = parseCelluleId(celluleId)
  const membres = await Promise.all(
    publicIds.map((publicId) =>
      db().individu.findFirstOrThrow({
        where: { publicId },
        select: { id: true, referentiel: { select: { dimensionId: true } } },
      }),
    ),
  )
  const dimensions = new Set(membres.map((m) => m.referentiel.dimensionId))
  if (dimensions.size !== membres.length) {
    throw new ValidationError('Plusieurs membres de la même dimension dans une cellule', {
      individuId: celluleId,
    })
  }
  return {
    cle: cleCellule(membres.map((m) => m.id)),
    publicId: celluleId,
    coordonnees: membres.map((m) => ({ dimensionId: m.referentiel.dimensionId, individuId: m.id })),
  }
}

export const indicateurIndividuConfig: SujetCommentaireConfig<Params> = {
  resoudreCibleEcriture: ({ indicateurId, individuId }) => {
    const principalId = requireCurrentPrincipalId()
    return ResultAsync.fromSafePromise(
      db().indicateur.findFirstOrThrow({
        where: withIndicateurReadPermission({ publicId: indicateurId }, principalId),
        select: { id: true },
      }),
    )
      .andThen((indicateur) =>
        ResultAsync.fromSafePromise(resoudreCelluleCommentaire(individuId)).map((cellule) => ({
          indId: indicateur.id,
          cellule,
        })),
      )
      .andThen(({ indId, cellule }) =>
        ensureIndicateurWriteCommentPermission({ indicateurId: indId, principalId }).map(() => ({
          indId,
          cellule,
        })),
      )
      .andThen(({ indId, cellule }) =>
        ResultAsync.fromSafePromise(
          ensureCellules({ indicateurId: indId, cellules: [cellule] }),
        ).map((ids) => ({ indId, celluleId: ids.get(cellule.cle)! })),
      )
      .map(({ indId, celluleId }) => ({
        principalId,
        satelliteCreate: (type: CommentaireType) => ({
          indicateurIndividu: {
            create: {
              indicateurId: indId,
              celluleId,
              type: type as IndicateurIndividuCommentaireType,
            },
          },
        }),
      }))
  },
  // Égalité exacte d'ensembles : toutes les coordonnées ∈ membres demandés, et
  // chaque membre demandé présent.
  whereLecture: ({ indicateurId, individuId }, principalId) => {
    const publicIds = parseCelluleId(individuId)
    return {
      indicateurIndividu: {
        indicateur: withIndicateurReadPermission({ publicId: indicateurId }, principalId),
        cellule: {
          coordonnees: { every: { individu: { publicId: { in: publicIds } } } },
          AND: publicIds.map((publicId) => ({
            coordonnees: { some: { individu: { publicId } } },
          })),
        },
      },
    }
  },
}

type Input = {
  params: Params
  body: CreerCommentaireBody<CommentaireType>
}

export const creerIndicateurIndividuCommentaire = (input: Input) =>
  creerCommentaire(indicateurIndividuConfig, input)
