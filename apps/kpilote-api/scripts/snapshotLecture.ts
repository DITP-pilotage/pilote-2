/* eslint-disable no-console -- script CLI */
// Snapshot des routes de lecture, pour prouver qu'une PR ne change rien pour
// l'existant (PIL-1979). Monte les routes réelles in-process et appelle chaque
// endpoint de lecture sur un échantillon fixe du seed.
//
// TEMPORAIRE : outil du chantier multifiltre (PIL-1963). À supprimer, avec le
// script `snapshot:lecture` du package.json et sa section du README, une fois la
// feature mergée.
//
// Tout s'exécute dans une transaction annulée à la fin : on y crée un utilisateur
// dédié qui a READ sur tous les indicateurs et collections (les routes de lecture
// filtrent par permission), sans rien laisser en base.
//
//   pnpm snapshot:lecture capture <fichier.json>
//   pnpm snapshot:lecture compare <fichier.json>
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

type SnapshotUser = { id: string; email: string; prenom: string; nom: string }

const SNAPSHOT_USER: SnapshotUser = {
  id: '019a4000-0000-7000-8000-000000000001',
  email: 'snapshot.lecture@example.com',
  prenom: 'Snapshot',
  nom: 'Lecture',
}
const ROLLBACK = Symbol('rollback')

const buildApp = ({ user }: { user: SnapshotUser }) => {
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

const buildRequests = ({ indicateurIds }: { indicateurIds: ReadonlyArray<string> }): string[] => {
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

type Liste = { status: number; body: { items: unknown[]; total: number } }

// Vrai si `obtenu` contient `attendu` à l'identique, en n'ajoutant que des clés
// d'objet (tableaux : même longueur, éléments comparés deux à deux).
const contientStrictement = ({
  obtenu,
  attendu,
}: {
  obtenu: unknown
  attendu: unknown
}): boolean => {
  if (Array.isArray(attendu)) {
    return (
      Array.isArray(obtenu) &&
      obtenu.length === attendu.length &&
      attendu.every((element, index) =>
        contientStrictement({ obtenu: obtenu[index], attendu: element }),
      )
    )
  }
  if (attendu && typeof attendu === 'object') {
    if (!obtenu || typeof obtenu !== 'object' || Array.isArray(obtenu)) return false
    return Object.entries(attendu as Record<string, unknown>).every(([cle, valeur]) =>
      contientStrictement({ obtenu: (obtenu as Record<string, unknown>)[cle], attendu: valeur }),
    )
  }
  return obtenu === attendu
}

const identite = (item: unknown): string | undefined => {
  const o = item as { id?: string; enfant?: { id?: string } }
  return o.id ?? o.enfant?.id
}

// Liste globale (`items` + `total`) : entités créées depuis la référence (nouveaux
// jeux de données). Une fois ces entités retirées, la page doit être un préfixe de
// la page de référence (les listes triées par nom décalent la fin de page), chaque
// entité de référence restant identique (champs ajoutés tolérés), et le total ne
// peut qu'augmenter.
const listeAvecSeulementDesEntitesAjoutees = ({
  obtenu,
  attendu,
}: {
  obtenu: unknown
  attendu: unknown
}): boolean => {
  const o = obtenu as Liste
  const a = attendu as Liste
  if (!Array.isArray(o.body?.items) || !Array.isArray(a.body?.items) || o.status !== a.status) {
    return false
  }
  const connues = new Set(a.body.items.map(identite))
  const filtres = o.body.items.filter((item) => connues.has(identite(item)))
  return (
    o.body.total >= a.body.total &&
    filtres.length > 0 &&
    contientStrictement({ obtenu: filtres, attendu: a.body.items.slice(0, filtres.length) })
  )
}

// Certaines requêtes n'ont pas d'ORDER BY (ex. `indicateur.findMany` de
// `listDernieresValeursForIndividu`) : l'ordre suit l'ordre physique des lignes en
// base, que n'importe quel UPDATE peut déplacer. Mêmes éléments, ordre différent.
const memesItemsDansUnAutreOrdre = ({
  obtenu,
  attendu,
}: {
  obtenu: unknown
  attendu: unknown
}): boolean => {
  const o = obtenu as Liste
  const a = attendu as Liste
  if (!Array.isArray(o.body?.items) || !Array.isArray(a.body?.items)) return false
  const trier = (items: unknown[]) => items.map((item) => JSON.stringify(item)).sort()
  return (
    o.status === a.status &&
    JSON.stringify(trier(o.body.items)) === JSON.stringify(trier(a.body.items))
  )
}

// `paths` : en comparaison, on rejoue exactement les chemins de la référence (les
// lots d'identifiants ne dépendent alors pas des entités ajoutées depuis).
const capture = async ({
  paths,
}: {
  paths: ReadonlyArray<string> | undefined
}): Promise<Snapshot> => {
  const indicateurs = await db().indicateur.findMany({ orderBy: { publicId: 'asc' } })
  const collections = await db().collection.findMany()
  await db().principal.create({ data: { id: SNAPSHOT_USER.id } })
  await db().utilisateur.create({
    data: { ...SNAPSHOT_USER, service: 'Outillage', fonction: 'snapshot' },
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
  const app = buildApp({ user: SNAPSHOT_USER })
  const snapshot: Snapshot = {}
  for (const path of paths ??
    buildRequests({ indicateurIds: indicateurs.map((i) => i.publicId) })) {
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

const comparer = ({ reference, courant }: { reference: Snapshot; courant: Snapshot }) => {
  const differences: string[] = []
  const ajouts: string[] = []
  const entitesAjoutees: string[] = []
  const ordreSeul: string[] = []
  for (const [path, attendu] of Object.entries(reference)) {
    const obtenu = courant[path]
    if (!obtenu) differences.push(`ABSENT ${path}`)
    else if (JSON.stringify(obtenu) === JSON.stringify(attendu)) continue
    else if (contientStrictement({ obtenu, attendu })) ajouts.push(`AJOUT ${path}`)
    else if (listeAvecSeulementDesEntitesAjoutees({ obtenu, attendu })) {
      entitesAjoutees.push(`ENTITES ${path}`)
    } else if (memesItemsDansUnAutreOrdre({ obtenu, attendu })) {
      ordreSeul.push(`ORDRE ${path}`)
    } else differences.push(`DIFF ${path}`)
  }
  const identiques =
    Object.keys(reference).length -
    differences.length -
    ajouts.length -
    entitesAjoutees.length -
    ordreSeul.length
  console.log(
    `${Object.keys(reference).length} requêtes comparées : ${identiques} identiques, ` +
      `${ajouts.length} avec uniquement des champs ajoutés, ` +
      `${entitesAjoutees.length} listes avec uniquement des entités ajoutées, ` +
      `${ordreSeul.length} avec les mêmes éléments dans un autre ordre (liste sans ORDER BY), ` +
      `${differences.length} différence(s).`,
  )
  for (const a of [...ajouts, ...entitesAjoutees, ...ordreSeul]) console.log(`  ${a}`)
  for (const d of differences) console.log(`  ${d}`)
  return differences.length
}

const main = async () => {
  const [mode, fichier] = process.argv.slice(2)
  if (!fichier || (mode !== 'capture' && mode !== 'compare')) {
    console.error('usage: pnpm snapshot:lecture capture|compare <fichier.json>')
    process.exit(2)
  }
  const reference =
    mode === 'compare' ? (JSON.parse(readFileSync(fichier, 'utf8')) as Snapshot) : null
  let courant: Snapshot = {}
  try {
    await prisma.$transaction(
      async (tx) =>
        runWithDb(tx, async () => {
          courant = await capture({ paths: reference ? Object.keys(reference) : undefined })
          // eslint-disable-next-line @typescript-eslint/only-throw-error -- sentinelle de rollback
          throw ROLLBACK
        }),
      { timeout: 600_000, maxWait: 10_000 },
    )
  } catch (error) {
    if (error !== ROLLBACK) throw error
  }
  if (!reference) {
    writeFileSync(fichier, JSON.stringify(courant, null, 2))
    const erreurs = Object.entries(courant).filter(([, r]) => r.status >= 400)
    console.log(`${Object.keys(courant).length} requêtes capturées, ${erreurs.length} en erreur.`)
    for (const [path, r] of erreurs) console.log(`  ${r.status} ${path}`)
    return
  }
  process.exitCode = comparer({ reference, courant }) === 0 ? 0 : 1
}

await main()
await prisma.$disconnect()
