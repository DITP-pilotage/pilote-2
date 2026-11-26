import { type IndiceConfiance } from '@pilote/kpilote-shared/niveauConfiance'
import { describe, expect, it } from 'vitest'

import { creerIndicateurIndividuCommentaire } from '@/indicateur/commands/creerIndicateurIndividuCommentaire'
import { IndicateurPermissionAction } from '@/generated/prisma/enums'
import { creerNiveauConfiance } from '@/niveauConfiance/commands/creerNiveauConfiance'
import { listDerniersNiveauxConfiance } from '@/niveauConfiance/queries/listDerniersNiveauxConfiance'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import {
  testDeptId,
  testIndicateurId,
  testIndicateurIds,
  testReferentielId,
} from '@/test/randomIds'
import { runAsPrincipal } from '@/test/runAsPrincipal'

const createCommentaireConfiance = async ({
  apiKeyId,
  indicateurId,
  individuId,
  indice,
  statut = 'PUBLIE',
}: {
  apiKeyId: string
  indicateurId: string
  individuId: string
  indice: IndiceConfiance | null
  statut?: 'BROUILLON' | 'PUBLIE'
}): Promise<void> => {
  const commentaire = await runAsPrincipal(apiKeyId, () =>
    creerIndicateurIndividuCommentaire({
      params: { indicateurId, individuId },
      body: { type: 'CONFIANCE', contenu: '', statut },
    }),
  )
  if (indice === null) return
  const commentaireId = commentaire._unsafeUnwrap().id
  await runAsPrincipal(apiKeyId, () => creerNiveauConfiance({ commentaireId, indice }))
}

const setupIndicateur = async ({
  indicateurId,
  individuId,
  referentielId,
}: {
  indicateurId: string
  individuId: string
  referentielId: string
}): Promise<void> => {
  await fixtures.indicateur({ publicId: indicateurId, nom: 'T', visibilite: 'PUBLIC' })
  await fixtures.indicateurReferentiel({
    indicateur: { publicId: indicateurId },
    referentiel: { publicId: referentielId, nom: 'Dép.' },
  })
  await fixtures.individu({ publicId: individuId, referentiel: { publicId: referentielId } })
}

const apiKeyWithWriteComment = (indicateurIds: ReadonlyArray<string>) =>
  fixtures.apiKey({
    permissions: indicateurIds.map((publicId) => ({
      indicateur: { publicId },
      action: IndicateurPermissionAction.WRITE_COMMENT,
    })),
  })

describe.concurrent('listDerniersNiveauxConfiance', () => {
  it(
    "renvoie l'indice du dernier commentaire CONFIANCE publié sur l'individu lu",
    integrationTest(async () => {
      const indicateurId = testIndicateurId()
      const individuId = testDeptId()
      await setupIndicateur({ indicateurId, individuId, referentielId: testReferentielId() })
      const apiKey = await apiKeyWithWriteComment([indicateurId])
      const params = { apiKeyId: apiKey.id, indicateurId, individuId }
      await createCommentaireConfiance({ ...params, indice: 'OBJECTIF_COMPROMIS' })
      await createCommentaireConfiance({ ...params, indice: 'OBJECTIF_ATTEIGNABLE' })

      const result = await runAsPrincipal(apiKey.id, () =>
        listDerniersNiveauxConfiance({
          query: { indicateurs: [indicateurId], individus: [individuId] },
        }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ indicateur: indicateurId, individu: individuId, indice: 'OBJECTIF_ATTEIGNABLE' }],
      })
    }),
  )

  it(
    'ignore un brouillon plus récent que le dernier commentaire publié',
    integrationTest(async () => {
      const indicateurId = testIndicateurId()
      const individuId = testDeptId()
      await setupIndicateur({ indicateurId, individuId, referentielId: testReferentielId() })
      const apiKey = await apiKeyWithWriteComment([indicateurId])
      const params = { apiKeyId: apiKey.id, indicateurId, individuId }
      await createCommentaireConfiance({ ...params, indice: 'OBJECTIF_SECURISE' })
      await createCommentaireConfiance({
        ...params,
        indice: 'OBJECTIF_COMPROMIS',
        statut: 'BROUILLON',
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listDerniersNiveauxConfiance({
          query: { indicateurs: [indicateurId], individus: [individuId] },
        }),
      )

      expect(result._unsafeUnwrap().items).toEqual([
        expect.objectContaining({ indice: 'OBJECTIF_SECURISE' }),
      ])
    }),
  )

  it(
    "omet l'indicateur dont le dernier commentaire publié ne porte pas de niveau",
    integrationTest(async () => {
      const indicateurId = testIndicateurId()
      const individuId = testDeptId()
      await setupIndicateur({ indicateurId, individuId, referentielId: testReferentielId() })
      const apiKey = await apiKeyWithWriteComment([indicateurId])
      const params = { apiKeyId: apiKey.id, indicateurId, individuId }
      await createCommentaireConfiance({ ...params, indice: 'OBJECTIF_SECURISE' })
      await createCommentaireConfiance({ ...params, indice: null })

      const result = await runAsPrincipal(apiKey.id, () =>
        listDerniersNiveauxConfiance({
          query: { indicateurs: [indicateurId], individus: [individuId] },
        }),
      )

      expect(result._unsafeUnwrap()).toEqual({ items: [] })
    }),
  )

  it(
    'lit chaque indicateur du lot sur son propre couple indicateur et individu',
    integrationTest(async () => {
      const [avecNiveau, sansCommentaire] = testIndicateurIds(2)
      const individuId = testDeptId()
      const referentielId = testReferentielId()
      await setupIndicateur({ indicateurId: avecNiveau, individuId, referentielId })
      await setupIndicateur({ indicateurId: sansCommentaire, individuId, referentielId })
      const apiKey = await apiKeyWithWriteComment([avecNiveau, sansCommentaire])
      await createCommentaireConfiance({
        apiKeyId: apiKey.id,
        indicateurId: avecNiveau,
        individuId,
        indice: 'APPUIS_NECESSAIRE',
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listDerniersNiveauxConfiance({
          query: { indicateurs: [avecNiveau, sansCommentaire], individus: [individuId] },
        }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        items: [{ indicateur: avecNiveau, individu: individuId, indice: 'APPUIS_NECESSAIRE' }],
      })
    }),
  )

  it(
    "lit l'individu racine sans sélection",
    integrationTest(async () => {
      const indicateurId = testIndicateurId()
      const individuId = testDeptId()
      await setupIndicateur({ indicateurId, individuId, referentielId: testReferentielId() })
      const apiKey = await apiKeyWithWriteComment([indicateurId])
      await createCommentaireConfiance({
        apiKeyId: apiKey.id,
        indicateurId,
        individuId,
        indice: 'OBJECTIF_SECURISE',
      })

      const result = await runAsPrincipal(apiKey.id, () =>
        listDerniersNiveauxConfiance({ query: { indicateurs: [indicateurId] } }),
      )

      expect(result._unsafeUnwrap().items).toEqual([
        { indicateur: indicateurId, individu: individuId, indice: 'OBJECTIF_SECURISE' },
      ])
    }),
  )
})
