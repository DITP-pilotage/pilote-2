/* eslint-disable no-console -- script CLI */
// Snapshot des routes de lecture sur le seed historique (POC dimensions, brief §5
// « Rétrocompatibilité »). Monte les routes réelles in-process et appelle chaque
// endpoint de lecture sur un échantillon fixe.
//
// Tout s'exécute dans une transaction annulée à la fin : on y crée un utilisateur
// dédié qui a READ sur tous les indicateurs et collections (les routes de lecture
// filtrent par permission), sans rien laisser en base.
//
//   tsx scripts/poc-dimensions/snapshotLecture.ts capture <fichier.json>
//   tsx scripts/poc-dimensions/snapshotLecture.ts compare <fichier.json>
//
// Les champs volatils (`createdAt`, `updatedAt`) sont neutralisés avant comparaison.
import { readFileSync, writeFileSync } from 'node:fs'

import { OpenAPIHono } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'

import { collectionRoutes } from '@/collection/routes'
import { runWithPrincipal } from '@/framework/auth/userContext'
import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { db, runWithDb } from '@/framework/persistence/dbStore'
import { prisma } from '@/framework/persistence/prisma'
import { indicateurRoutes } from '@/indicateur/routes'
import { individuRoutes } from '@/individu/routes'
import { objectifIndicateurIndividuRoutes } from '@/objectifIndicateurIndividu/routes'
import { referentielRoutes } from '@/referentiel/routes'
import { relationRoutes } from '@/relation/routes'
import { valeurAvancementRoutes } from '@/valeurAvancement/routes'

const SNAPSHOT_USER = {
  id: '019a4000-0000-7000-8000-000000000001',
  email: 'snapshot.poc@example.com',
  prenom: 'Snapshot',
  nom: 'POC',
}
const ROLLBACK = Symbol('rollback')

const buildApp = (user: { id: string; email: string; prenom: string; nom: string }) => {
  const asUser = createMiddleware(async (_context, next) => {
    await runWithPrincipal({ kind: 'user', user }, next)
  })
  const app = new OpenAPIHono()
  app.use('*', asUser)
  for (const routes of [
    indicateurRoutes,
    valeurAvancementRoutes,
    objectifIndicateurIndividuRoutes,
    referentielRoutes,
    individuRoutes,
    relationRoutes,
    collectionRoutes,
  ]) {
    app.route('/', routes)
  }
  registerErrorHandler(app)
  return app
}

const INDIVIDUS = ['NAT-FR', 'REG-93', 'REG-11', 'DEPT-13', 'DEPT-84', 'DEPT-75']
const REFERENTIELS = ['REF-NAT', 'REF-REG', 'REF-DEPT']
const COLLECTIONS = ['COL-001', 'COL-002', 'COL-003', 'COL-004', 'COL-005']

const VOLATILS = new Set(['createdAt', 'updatedAt'])

const normaliser = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(normaliser)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !VOLATILS.has(key))
        .map(([key, v]) => [key, normaliser(v)]),
    )
  }
  return value
}

const buildRequests = (indicateurIds: ReadonlyArray<string>): string[] => {
  const individus = INDIVIDUS.join(',')
  const requests: string[] = [
    '/indicateurs?pageSize=100',
    '/referentiels?pageSize=100',
    '/individus?pageSize=100',
    '/relations?pageSize=100',
    '/collections?pageSize=100',
    ...REFERENTIELS.map((ref) => `/referentiels/${ref}/individus?pageSize=100`),
    ...COLLECTIONS.flatMap((col) => [
      `/collections/${col}`,
      ...INDIVIDUS.map((ind) => `/collections/${col}/taux-progression?individu=${ind}`),
    ]),
  ]
  for (const id of indicateurIds) {
    requests.push(
      `/indicateurs/${id}`,
      `/indicateurs/${id}/valeurs?individus=${individus}`,
      `/indicateurs/${id}/valeurs?individus=${individus}&dateTrunc=year`,
      `/indicateurs/${id}/valeurs?individus=NAT-FR&dateDebut=2025-01-01&dateFin=2025-12-31&dateTrunc=quarter`,
      `/indicateurs/${id}/objectifs?individus=${individus}`,
      `/indicateurs/${id}/taux-progression?individus=${individus}`,
      `/indicateurs/${id}/taux-progression?individus=${individus}&dateTruncObjectif=year`,
      `/indicateurs/${id}/synthese-individus?individus=${individus}`,
      `/indicateurs/${id}/valeurs-remarquables?referentiels=${REFERENTIELS.join(',')}`,
      `/indicateurs/${id}/individus?pageSize=100`,
      ...INDIVIDUS.slice(0, 2).flatMap((ind) =>
        ['DEFAUT', 'CONFIANCE'].map(
          (type) => `/indicateurs/${id}/individus/${ind}/commentaires?type=${type}`,
        ),
      ),
    )
  }
  for (const ind of INDIVIDUS) {
    // Les routes /individus/{id}/… plafonnent la liste CSV : on découpe par 20.
    for (let i = 0; i < indicateurIds.length; i += 20) {
      const lot = indicateurIds.slice(i, i + 20).join(',')
      requests.push(
        `/individus/${ind}/dernieres-valeurs?indicateurs=${lot}`,
        `/individus/${ind}/taux-progression/indicateurs?indicateurs=${lot}`,
      )
    }
    requests.push(
      `/individus/${ind}/taux-progression/collections?collections=${COLLECTIONS.join(',')}`,
    )
  }
  return requests
}

type Snapshot = Record<string, { status: number; body: unknown }>

const capture = async (): Promise<Snapshot> => {
  const indicateurs = await db().indicateur.findMany({
    select: { id: true, publicId: true },
    orderBy: { publicId: 'asc' },
  })
  const collections = await db().collection.findMany({ select: { id: true } })
  await db().principal.create({ data: { id: SNAPSHOT_USER.id } })
  await db().utilisateur.create({
    data: { ...SNAPSHOT_USER, service: 'POC', fonction: 'snapshot' },
  })
  await db().indicateurPermission.createMany({
    data: indicateurs.map((i) => ({
      principalId: SNAPSHOT_USER.id,
      indicateurId: i.id,
      action: 'READ',
    })),
  })
  await db().collectionPermission.createMany({
    data: collections.map((c) => ({
      principalId: SNAPSHOT_USER.id,
      collectionId: c.id,
      action: 'READ',
    })),
  })
  const app = buildApp(SNAPSHOT_USER)
  const snapshot: Snapshot = {}
  for (const path of buildRequests(indicateurs.map((i) => i.publicId))) {
    const response = await app.request(path)
    const text = await response.text()
    let body: unknown = text
    try {
      body = JSON.parse(text)
    } catch {
      // corps non JSON conservé brut
    }
    snapshot[path] = { status: response.status, body: normaliser(body) }
  }
  return snapshot
}

const main = async () => {
  const [mode, fichier] = process.argv.slice(2)
  if (!fichier || (mode !== 'capture' && mode !== 'compare')) {
    console.error('usage: snapshotLecture.ts capture|compare <fichier.json>')
    process.exit(2)
  }
  let courant: Snapshot = {}
  try {
    await prisma.$transaction(
      async (tx) =>
        runWithDb(tx, async () => {
          courant = await capture()
          // eslint-disable-next-line @typescript-eslint/only-throw-error -- sentinelle de rollback
          throw ROLLBACK
        }),
      { timeout: 600_000, maxWait: 10_000 },
    )
  } catch (error) {
    if (error !== ROLLBACK) throw error
  }
  if (mode === 'capture') {
    writeFileSync(fichier, JSON.stringify(courant, null, 2))
    const erreurs = Object.entries(courant).filter(([, r]) => r.status >= 400)
    console.log(`${Object.keys(courant).length} requêtes capturées, ${erreurs.length} en erreur.`)
    for (const [path, r] of erreurs) console.log(`  ${r.status} ${path}`)
    return
  }
  const reference = JSON.parse(readFileSync(fichier, 'utf8')) as Snapshot
  const differences: string[] = []
  for (const [path, attendu] of Object.entries(reference)) {
    const obtenu = courant[path]
    if (!obtenu) differences.push(`ABSENT ${path}`)
    else if (JSON.stringify(obtenu) !== JSON.stringify(attendu)) differences.push(`DIFF ${path}`)
  }
  console.log(
    `${Object.keys(reference).length} requêtes comparées, ${differences.length} différence(s).`,
  )
  for (const d of differences) console.log(`  ${d}`)
  process.exitCode = differences.length === 0 ? 0 : 1
}

await main()
await prisma.$disconnect()
