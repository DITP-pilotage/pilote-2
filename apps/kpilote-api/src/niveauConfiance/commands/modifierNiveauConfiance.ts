import {
  type ModifierNiveauConfianceBody,
  type NiveauConfianceApiModel,
} from '@pilote/kpilote-shared/niveauConfiance'
import { ResultAsync } from 'neverthrow'

import { ensureAuteur } from '@/framework/auth/principalPredicates'
import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { niveauConfianceInclude, toNiveauConfianceApiModel } from '@/niveauConfiance/utils'

const ensureAuteurDuNiveau = async (niveauConfianceId: string): Promise<void> => {
  const { createdBy } = await db().niveauConfiance.findUniqueOrThrow({
    where: { id: niveauConfianceId },
    select: { createdBy: true },
  })
  ensureAuteur({ createdBy, message: 'Seul l’auteur peut modifier ce niveau de confiance' })
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

const performModifier = async (
  niveauConfianceId: string,
  body: ModifierNiveauConfianceBody,
): Promise<NiveauConfianceApiModel> => {
  const principalId = requireCurrentPrincipalId()
  await ensureAuteurDuNiveau(niveauConfianceId)
  const niveau = await updateIndice({ niveauConfianceId, indice: body.indice, principalId })
  return toNiveauConfianceApiModel(niveau)
}

export const modifierNiveauConfiance = (
  niveauConfianceId: string,
  body: ModifierNiveauConfianceBody,
): ResultAsync<NiveauConfianceApiModel, never> =>
  ResultAsync.fromSafePromise(performModifier(niveauConfianceId, body))
