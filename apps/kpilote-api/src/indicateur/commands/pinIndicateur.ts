import { err, ok, type Result, ResultAsync } from 'neverthrow'

import { ensureOidcUser } from '@/framework/auth/principalPredicates'
import { requireUser } from '@/framework/auth/userContext'
import { db } from '@/framework/persistence/dbStore'
import { type Prisma } from '@/generated/prisma/client'
import { withIndicateurReadPermission } from '@/indicateur/permissions'
import { checkLimiteEpingles, type LimiteEpinglesAtteinteError } from '@/indicateur/rules'

export type PinIndicateurError = LimiteEpinglesAtteinteError

type PinIndicateurParams = { publicId: string }

const loadPinIndicateurContext = async ({
  publicId,
  utilisateurId,
}: {
  publicId: string
  utilisateurId: string
}) => {
  const readable = (where: Prisma.IndicateurWhereInput) =>
    withIndicateurReadPermission(where, utilisateurId)

  // Un indicateur illisible répond comme un indicateur inconnu (404).
  const indicateur = await db().indicateur.findFirstOrThrow({ where: readable({ publicId }) })
  const epingle = await db().indicateurEpingle.findUnique({
    where: { utilisateurId_indicateurId: { utilisateurId, indicateurId: indicateur.id } },
  })
  // Seules les épingles encore lisibles comptent : une épingle sur un indicateur
  // devenu illisible n'apparaît nulle part et ne doit pas occuper de place.
  const nombreEpingles = await db().indicateur.count({
    where: readable({ epingles: { some: { utilisateurId } } }),
  })
  return { indicateur, isPinned: epingle !== null, nombreEpingles }
}

const performPin = async ({
  publicId,
}: PinIndicateurParams): Promise<Result<void, PinIndicateurError>> => {
  ensureOidcUser()
  const { id: utilisateurId } = requireUser()

  const context = await loadPinIndicateurContext({ publicId, utilisateurId })
  if (context.isPinned) return ok()

  const limite = checkLimiteEpingles({ nombreEpingles: context.nombreEpingles })
  if (limite.isErr()) return err(limite.error)

  // Deux épinglages simultanés du même indicateur ne trouvent ni l'un ni l'autre
  // l'épingle : le second ne doit pas échouer sur la clé primaire.
  await db().indicateurEpingle.createMany({
    data: [{ utilisateurId, indicateurId: context.indicateur.id }],
    skipDuplicates: true,
  })
  return ok()
}

export const pinIndicateur = (params: PinIndicateurParams): ResultAsync<void, PinIndicateurError> =>
  new ResultAsync(performPin(params))
