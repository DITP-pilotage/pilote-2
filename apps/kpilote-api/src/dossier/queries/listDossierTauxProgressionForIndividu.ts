import {
  type DossierTauxProgressionSummaryListApiModel,
  type ListDossierTauxProgressionForIndividuQuery,
} from '@pilote/kpilote-shared/dossierTauxProgression'
import { ResultAsync } from 'neverthrow'

import { requireCurrentPrincipalId } from '@/framework/auth/userContext'
import { withConcurrency } from '@/framework/concurrency'
import { logger } from '@/framework/logger/logger'
import { db } from '@/framework/persistence/dbStore'
import { Prisma } from '@/generated/prisma/client'
import { computeContributions } from '@/dossier/queries/computeDossierContributions'
import { withDossierReadPermission } from '@/dossier/permissions'
import { resolveDossierTauxProgression } from '@/dossier/resolveDossierTauxProgression'
import { type IndividuRef } from '@/valeurAvancement/resolveSerieIndividu'

const dossierListArgs = {
  select: {
    publicId: true,
    indicateurs: {
      orderBy: { createdAt: 'asc' as const },
      select: {
        ponderation: true,
        indicateur: { select: { id: true, publicId: true } },
      },
    },
  },
} satisfies Prisma.DossierDefaultArgs

type DossierRow = Prisma.DossierGetPayload<typeof dossierListArgs>

export const listDossierTauxProgressionForIndividu = (
  individuPublicId: string,
  params: ListDossierTauxProgressionForIndividuQuery,
): ResultAsync<DossierTauxProgressionSummaryListApiModel, never> =>
  ResultAsync.fromSafePromise(build(individuPublicId, params))

const build = async (
  individuPublicId: string,
  params: ListDossierTauxProgressionForIndividuQuery,
): Promise<DossierTauxProgressionSummaryListApiModel> => {
  const principalId = requireCurrentPrincipalId()

  const individuCible = await db().individu.findFirstOrThrow({
    where: { publicId: individuPublicId },
    select: { id: true, publicId: true, referentielId: true },
  })

  const startedAt = performance.now()

  const dossiers = await db().dossier.findMany({
    where: withDossierReadPermission({ publicId: { in: params.dossiers } }, principalId),
    ...dossierListArgs,
  })

  const items = await withConcurrency(
    dossiers.map((dossier) => () => computeDossierTaux(dossier, individuCible)),
  )

  logger.info(
    {
      event: 'dossier.listDossierTauxProgressionForIndividu.timing',
      individuId: individuCible.id,
      nbDossiersDemandes: params.dossiers.length,
      nbDossiersAccessibles: dossiers.length,
      nbItems: items.length,
      durationMs: Math.round(performance.now() - startedAt),
    },
    'listDossierTauxProgressionForIndividu computed',
  )

  return { items }
}

const computeDossierTaux = async (
  dossier: DossierRow,
  individuCible: IndividuRef,
): Promise<{ dossier: string; tauxProgression: number | null }> => {
  if (dossier.indicateurs.length === 0) {
    return { dossier: dossier.publicId, tauxProgression: null }
  }

  const contributions = await computeContributions(dossier.indicateurs, individuCible)
  const { tauxProgression } = resolveDossierTauxProgression(contributions)
  return { dossier: dossier.publicId, tauxProgression }
}
