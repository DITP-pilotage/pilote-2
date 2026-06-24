import {
  type ModifierNiveauConfianceBody,
  type NiveauConfianceApiModel,
} from '@pilote/mb-shared/niveauConfiance'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { ForbiddenError } from '@/framework/errors/AppError'
import { db } from '@/framework/persistence/dbStore'
import { ensureIndicateurWritePermission } from '@/indicateur/permissions'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/niveauConfiance/utils'
import { ensurePanierWritePermission } from '@/panier/permissions'

const ensureAuteurEtPermissionWrite = async (
  niveauConfianceId: string,
  principalId: string,
): Promise<void> => {
  const niveau = await db().niveauConfiance.findUniqueOrThrow({
    where: { id: niveauConfianceId },
    select: {
      createdBy: true,
      commentaire: {
        select: {
          indicateurIndividu: { select: { indicateurId: true } },
          panierIndividu: { select: { panierId: true } },
          panier: { select: { panierId: true } },
        },
      },
    },
  })
  if (niveau.createdBy !== principalId) {
    throw new ForbiddenError('Seul l’auteur peut modifier ce niveau de confiance')
  }
  const { indicateurIndividu, panierIndividu, panier } = niveau.commentaire
  if (indicateurIndividu) {
    await ensureIndicateurWritePermission({
      indicateurId: indicateurIndividu.indicateurId,
      principalId,
    })
    return
  }
  const panierId = panierIndividu?.panierId ?? panier?.panierId
  if (!panierId) {
    throw new ForbiddenError('Commentaire sans sujet rattaché')
  }
  await ensurePanierWritePermission({ panierId, principalId })
}

const updateIndice = ({
  niveauConfianceId,
  indice,
  principalId,
}: {
  niveauConfianceId: string
  indice: ModifierNiveauConfianceBody['indice']
  principalId: string
}) =>
  db().niveauConfiance.update({
    where: { id: niveauConfianceId },
    data: { indice, updatedBy: principalId },
    include: niveauConfianceInclude,
  })

export const modifierNiveauConfiance = (
  niveauConfianceId: string,
  body: ModifierNiveauConfianceBody,
): ResultAsync<NiveauConfianceApiModel, never> => {
  const principalId = requireCurrentPrincipalId()
  return ResultAsync.fromSafePromise(
    ensureAuteurEtPermissionWrite(niveauConfianceId, principalId).then(() =>
      updateIndice({ niveauConfianceId, indice: body.indice, principalId }),
    ),
  ).map(toNiveauConfianceApiModel)
}
