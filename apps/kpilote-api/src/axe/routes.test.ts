import { type AxeApiModel, type ModaliteListApiModel } from '@pilote/kpilote-shared/axe'
import { describe, expect, it, vi } from 'vitest'

import { axeRoutes } from '@/axe/routes'
import { ApiKeyRole } from '@/generated/prisma/enums'
import { buildTestApp } from '@/test/buildTestApp'
import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { testApiKeyRawKey, testAxeId, testIndicateurId, testModaliteId } from '@/test/randomIds'

// La route ouvre sa propre transaction (`withTransaction`), qui ne verrait pas les
// fixtures de la transaction de test : ici elle rejoint la transaction courante
// (celle d'`integrationTest`, annulée en fin de test). Même patron que
// valeurAvancement/routes.test.ts.
vi.mock('@/framework/persistence/withTransaction', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/framework/persistence/withTransaction')>()
  const { db } = await import('@/framework/persistence/dbStore')
  return {
    ...original,
    withTransaction: <T>(fn: () => Promise<T>): Promise<T> => {
      try {
        db()
      } catch {
        return original.withTransaction(fn)
      }
      return fn()
    },
  }
})

const buildApp = () => buildTestApp(axeRoutes)

const cleApi = async (role: ApiKeyRole): Promise<string> => {
  const rawKey = testApiKeyRawKey()
  await fixtures.apiKey({ rawKey, role })
  return rawKey
}

const requete = async ({
  cle,
  method,
  path,
  body,
}: {
  cle: string
  method: 'GET' | 'PUT' | 'DELETE'
  path: string
  body?: unknown
}) =>
  buildApp().request(path, {
    method,
    headers: {
      Authorization: `Bearer ${cle}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

// Axe à deux niveaux (Famille → Type) avec une famille et un type.
const axeImbrique = async () => {
  const axe = { publicId: testAxeId(), nom: 'Type de fraude' }
  const famille = await fixtures.modalite({
    publicId: testModaliteId(),
    nom: 'Fraude fiscale',
    niveau: { axe, ordre: 1, nom: 'Famille' },
  })
  await fixtures.niveauAxe({ axe, ordre: 2, nom: 'Type' })
  const type = await fixtures.modalite({
    publicId: testModaliteId(),
    nom: 'Fraude à la TVA',
    niveau: { axe, ordre: 2 },
    parent: { publicId: famille.publicId },
  })
  return { axeId: axe.publicId, famille, type }
}

describe.concurrent('GET /axes', () => {
  it(
    'liste les axes avec leurs niveaux et leur nombre de modalités',
    integrationTest(async () => {
      const { axeId } = await axeImbrique()
      const cle = await cleApi(ApiKeyRole.CONTRIBUTOR)

      const response = await requete({ cle, method: 'GET', path: `/axes?recherche=fraude` })

      expect(response.status).toBe(200)
      const body = (await response.json()) as { items: AxeApiModel[] }
      expect(body.items.find((axe) => axe.id === axeId)).toMatchObject({
        nom: 'Type de fraude',
        niveaux: [
          { ordre: 1, nom: 'Famille' },
          { ordre: 2, nom: 'Type' },
        ],
        nombreModalites: 2,
      })
    }),
  )
})

describe.concurrent('GET /axes/{id}', () => {
  it(
    'renvoie l’axe à tout utilisateur authentifié',
    integrationTest(async () => {
      const { axeId } = await axeImbrique()
      const cle = await cleApi(ApiKeyRole.CONTRIBUTOR)

      const response = await requete({ cle, method: 'GET', path: `/axes/${axeId}` })

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ id: axeId, nombreModalites: 2 })
    }),
  )

  it(
    'renvoie 404 pour un axe inconnu',
    integrationTest(async () => {
      const cle = await cleApi(ApiKeyRole.CONTRIBUTOR)

      const response = await requete({ cle, method: 'GET', path: `/axes/${testAxeId()}` })

      expect(response.status).toBe(404)
    }),
  )
})

describe.concurrent('PUT /axes/{id}', () => {
  it(
    'renvoie (200) l’axe enregistré',
    integrationTest(async () => {
      const axeId = testAxeId()
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}`,
        body: {
          nom: 'Type de fraude',
          description: 'Familles et types',
          niveaux: [{ nom: 'Famille' }, { nom: 'Type' }],
        },
      })

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id: axeId,
        nom: 'Type de fraude',
        description: 'Familles et types',
        niveaux: [
          { ordre: 1, nom: 'Famille' },
          { ordre: 2, nom: 'Type' },
        ],
        nombreModalites: 0,
      })
    }),
  )

  it(
    'refuse (409) de supprimer un niveau qui porte des modalités',
    integrationTest(async () => {
      const { axeId } = await axeImbrique()
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}`,
        body: { nom: 'Type de fraude', description: null, niveaux: [{ nom: 'Famille' }] },
      })

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        code: 'NIVEAU_PORTE_MODALITES',
        details: { ordres: [2] },
      })
    }),
  )

  it(
    'refuse (409) de changer le nombre de niveaux d’un axe déclaré par un indicateur',
    integrationTest(async () => {
      const axeId = testAxeId()
      const indicateurId = testIndicateurId()
      await fixtures.niveauAxe({ axe: { publicId: axeId }, ordre: 1, nom: 'Opérateur' })
      await fixtures.indicateurAxe({
        indicateur: { publicId: indicateurId },
        axe: { publicId: axeId },
      })
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}`,
        body: {
          nom: 'Opérateur',
          description: null,
          niveaux: [{ nom: 'Groupe' }, { nom: 'Opérateur' }],
        },
      })

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        code: 'AXE_UTILISE',
        details: { indicateurs: [indicateurId] },
      })
    }),
  )

  it(
    'permet de renommer les niveaux d’un axe déclaré par un indicateur',
    integrationTest(async () => {
      const axeId = testAxeId()
      await fixtures.niveauAxe({ axe: { publicId: axeId }, ordre: 1, nom: 'Opérateur' })
      await fixtures.indicateurAxe({
        indicateur: { publicId: testIndicateurId() },
        axe: { publicId: axeId },
      })
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}`,
        body: { nom: 'Opérateurs', description: null, niveaux: [{ nom: 'Marque' }] },
      })

      expect(response.status).toBe(200)
      expect(((await response.json()) as AxeApiModel).niveaux).toEqual([
        { ordre: 1, nom: 'Marque' },
      ])
    }),
  )

  it(
    'refuse (403) une clé qui n’est pas ADMIN',
    integrationTest(async () => {
      const cle = await cleApi(ApiKeyRole.CONTRIBUTOR)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${testAxeId()}`,
        body: { nom: 'Opérateur', description: null, niveaux: [{ nom: 'Opérateur' }] },
      })

      expect(response.status).toBe(403)
    }),
  )
})

describe.concurrent('GET /axes/{id}/modalites', () => {
  it(
    'liste les modalités avec leur niveau et leur parent',
    integrationTest(async () => {
      const { axeId, famille, type } = await axeImbrique()
      const cle = await cleApi(ApiKeyRole.CONTRIBUTOR)

      const response = await requete({ cle, method: 'GET', path: `/axes/${axeId}/modalites` })

      expect(response.status).toBe(200)
      const body = (await response.json()) as ModaliteListApiModel
      expect(
        body.items.map(({ id, nom, niveau, parent }) => ({ id, nom, niveau, parent })),
      ).toEqual([
        { id: famille.publicId, nom: 'Fraude fiscale', niveau: 1, parent: null },
        { id: type.publicId, nom: 'Fraude à la TVA', niveau: 2, parent: famille.publicId },
      ])
    }),
  )

  it(
    'renvoie 404 pour un axe inconnu',
    integrationTest(async () => {
      const cle = await cleApi(ApiKeyRole.CONTRIBUTOR)

      const response = await requete({
        cle,
        method: 'GET',
        path: `/axes/${testAxeId()}/modalites`,
      })

      expect(response.status).toBe(404)
    }),
  )
})

describe.concurrent('PUT /axes/{id}/modalites/{modaliteId}', () => {
  it(
    'renvoie (200) la modalité enregistrée',
    integrationTest(async () => {
      const { axeId } = await axeImbrique()
      const modaliteId = testModaliteId()
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}/modalites/${modaliteId}`,
        body: { nom: 'Fraude sociale', parent: null },
      })

      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({
        id: modaliteId,
        nom: 'Fraude sociale',
        niveau: 1,
        parent: null,
      })
    }),
  )

  it(
    'refuse (409) de changer le parent d’une modalité',
    integrationTest(async () => {
      const { axeId, type, famille } = await axeImbrique()
      const autreFamille = await fixtures.modalite({
        niveau: { axe: { publicId: axeId }, ordre: 1 },
      })
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}/modalites/${type.publicId}`,
        body: { nom: 'Fraude à la TVA', parent: autreFamille.publicId },
      })

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        code: 'CHANGEMENT_PARENT_INTERDIT',
        details: { parentActuel: famille.publicId },
      })
    }),
  )

  it(
    'refuse (400) un parent inconnu',
    integrationTest(async () => {
      const { axeId } = await axeImbrique()
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}/modalites/${testModaliteId()}`,
        body: { nom: 'Orpheline', parent: testModaliteId() },
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ code: 'PARENT_INCONNU' })
    }),
  )

  it(
    'refuse (400) un parent d’un autre axe',
    integrationTest(async () => {
      const { axeId } = await axeImbrique()
      const autreAxeId = testAxeId()
      const parent = await fixtures.modalite({ niveau: { axe: { publicId: autreAxeId } } })
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}/modalites/${testModaliteId()}`,
        body: { nom: 'Mauvais parent', parent: parent.publicId },
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        code: 'PARENT_AUTRE_AXE',
        details: { axe: autreAxeId },
      })
    }),
  )

  it(
    'refuse (400) un parent au dernier niveau',
    integrationTest(async () => {
      const { axeId, type } = await axeImbrique()
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}/modalites/${testModaliteId()}`,
        body: { nom: 'Trop profonde', parent: type.publicId },
      })

      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({
        code: 'NIVEAU_INEXISTANT',
        details: { ordre: 3 },
      })
    }),
  )

  it(
    'refuse (409) un identifiant déjà pris dans un autre axe',
    integrationTest(async () => {
      const { axeId } = await axeImbrique()
      const autreAxeId = testAxeId()
      const ailleurs = await fixtures.modalite({ niveau: { axe: { publicId: autreAxeId } } })
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}/modalites/${ailleurs.publicId}`,
        body: { nom: 'Doublon', parent: null },
      })

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        code: 'MODALITE_AUTRE_AXE',
        details: { axe: autreAxeId },
      })
    }),
  )

  it(
    'renvoie 404 pour un axe inconnu',
    integrationTest(async () => {
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${testAxeId()}/modalites/${testModaliteId()}`,
        body: { nom: 'Sans axe', parent: null },
      })

      expect(response.status).toBe(404)
    }),
  )

  it(
    'refuse (403) une clé qui n’est pas ADMIN',
    integrationTest(async () => {
      const { axeId } = await axeImbrique()
      const cle = await cleApi(ApiKeyRole.CONTRIBUTOR)

      const response = await requete({
        cle,
        method: 'PUT',
        path: `/axes/${axeId}/modalites/${testModaliteId()}`,
        body: { nom: 'Interdite', parent: null },
      })

      expect(response.status).toBe(403)
    }),
  )
})

describe.concurrent('DELETE /axes/{id}/modalites/{modaliteId}', () => {
  it(
    'renvoie 204 après la suppression',
    integrationTest(async () => {
      const { axeId, type } = await axeImbrique()
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'DELETE',
        path: `/axes/${axeId}/modalites/${type.publicId}`,
      })

      expect(response.status).toBe(204)
    }),
  )

  it(
    'refuse (409) de supprimer une modalité qui a des enfants',
    integrationTest(async () => {
      const { axeId, famille, type } = await axeImbrique()
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'DELETE',
        path: `/axes/${axeId}/modalites/${famille.publicId}`,
      })

      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({
        code: 'MODALITE_A_DES_ENFANTS',
        details: { enfants: [type.publicId] },
      })
    }),
  )

  it(
    'renvoie 404 pour une modalité d’un autre axe',
    integrationTest(async () => {
      const { type } = await axeImbrique()
      const autreAxe = await fixtures.axe()
      const cle = await cleApi(ApiKeyRole.ADMIN)

      const response = await requete({
        cle,
        method: 'DELETE',
        path: `/axes/${autreAxe.publicId}/modalites/${type.publicId}`,
      })

      expect(response.status).toBe(404)
    }),
  )

  it(
    'refuse (403) une clé qui n’est pas ADMIN',
    integrationTest(async () => {
      const { axeId, type } = await axeImbrique()
      const cle = await cleApi(ApiKeyRole.CONTRIBUTOR)

      const response = await requete({
        cle,
        method: 'DELETE',
        path: `/axes/${axeId}/modalites/${type.publicId}`,
      })

      expect(response.status).toBe(403)
    }),
  )
})
