/* eslint-disable no-console -- script CLI */
// Comparaison chiffrée du contournement historique « collection d'opérateurs »
// (COL-010 = IND-111..115, un indicateur mono-territoire par opérateur) et de
// sa migration vers une dimension Opérateur (IND-101, territoire × opérateur).
// Cf. docs/architecture/dimensions-design.md §10.
//
// Même technique que snapshotLecture.ts : routes réelles in-process, dans une
// transaction annulée à la fin (utilisateur dédié avec READ, variante de
// pondération), sans rien laisser en base.
//
//   tsx scripts/poc-dimensions/comparerContournement.ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { createMiddleware } from 'hono/factory'

import { collectionRoutes } from '@/collection/routes'
import { runWithPrincipal } from '@/framework/auth/userContext'
import { registerErrorHandler } from '@/framework/errors/errorHandler'
import { db, runWithDb } from '@/framework/persistence/dbStore'
import { prisma } from '@/framework/persistence/prisma'
import { valeurAvancementRoutes } from '@/valeurAvancement/routes'

const COMPARAISON_USER = {
  id: '019a4000-0000-7000-8000-000000000002',
  email: 'comparaison.poc@example.com',
  prenom: 'Comparaison',
  nom: 'POC',
}
const ROLLBACK = Symbol('rollback')

// DEPT-29 : les 5 opérateurs ; DEPT-13 : sans opérateur régional ; DEPT-974 :
// ni Free ni opérateur régional (DROM).
const CIBLES = ['DEPT-29', 'DEPT-13', 'DEPT-974', 'NAT-FR']
const OPERATEURS = [
  { indicateur: 'IND-111', operateur: 'OP-ORANGE' },
  { indicateur: 'IND-112', operateur: 'OP-SFR' },
  { indicateur: 'IND-113', operateur: 'OP-FREE' },
  { indicateur: 'IND-114', operateur: 'OP-BOUYGUES' },
  { indicateur: 'IND-115', operateur: 'OP-REGIONAL' },
]
const INDICATEURS = ['IND-101', ...OPERATEURS.map((o) => o.indicateur)]

type PointTaux = {
  date: string
  valeur: number
  valeurCible: number
  tauxProgression: number | null
}
type PointValeur = { date: string; valeur: number }
type TauxCollection = {
  tauxProgression: number | null
  contributions: Array<{ indicateur: string; tauxProgression: number | null; ponderation: number }>
}

const buildApp = () => {
  const asUser = createMiddleware(async (_context, next) => {
    await runWithPrincipal({ kind: 'user', user: COMPARAISON_USER }, next)
  })
  const app = new OpenAPIHono()
  app.use('*', asUser)
  app.route('/', valeurAvancementRoutes)
  app.route('/', collectionRoutes)
  registerErrorHandler(app)
  return app
}

const lire = async <T>({ app, path }: { app: OpenAPIHono; path: string }): Promise<T> => {
  const response = await app.request(path)
  if (response.status !== 200) {
    throw new Error(`${response.status} ${path} : ${await response.text()}`)
  }
  return (await response.json()) as T
}

const dernier = <T>(items: ReadonlyArray<T>): T | undefined => items[items.length - 1]

// Tronqué à 2 décimales, comme l'API (ROUND_DOWN).
const pct = (taux: number | null | undefined): string =>
  taux === null || taux === undefined ? 'null' : `${(Math.floor(taux * 100) / 100).toFixed(2)} %`

const nombre = (valeur: number | undefined): string =>
  valeur === undefined ? '—' : valeur.toLocaleString('fr-FR')

const comparer = async (): Promise<string[]> => {
  const indicateurs = await db().indicateur.findMany({
    where: { publicId: { in: INDICATEURS } },
  })
  const col010 = await db().collection.findUniqueOrThrow({ where: { publicId: 'COL-010' } })
  await db().principal.create({ data: { id: COMPARAISON_USER.id } })
  await db().utilisateur.create({
    data: { ...COMPARAISON_USER, service: 'POC', fonction: 'comparaison' },
  })
  await db().indicateurPermission.createMany({
    data: indicateurs.map((i) => ({
      principalId: COMPARAISON_USER.id,
      indicateurId: i.id,
      action: 'READ',
    })),
  })
  await db().collectionPermission.create({
    data: { principalId: COMPARAISON_USER.id, collectionId: col010.id, action: 'READ' },
  })
  const app = buildApp()
  const lignes: string[] = []

  const tauxCollection = async (cible: string) =>
    lire<TauxCollection>({ app, path: `/collections/COL-010/taux-progression?individu=${cible}` })

  const resultats = new Map<string, { brut: TauxCollection; sansRegional?: TauxCollection }>()
  for (const cible of CIBLES) resultats.set(cible, { brut: await tauxCollection(cible) })

  // Variante : l'opérateur régional pondéré 0 (exclu de la moyenne).
  const ind115 = indicateurs.find((i) => i.publicId === 'IND-115')!
  await db().collectionIndicateur.update({
    where: { collectionId_indicateurId: { collectionId: col010.id, indicateurId: ind115.id } },
    data: { ponderation: 0 },
  })
  for (const cible of CIBLES) resultats.get(cible)!.sansRegional = await tauxCollection(cible)

  for (const cible of CIBLES) {
    const taux101 = dernier(
      (
        await lire<{ items: PointTaux[] }>({
          app,
          path: `/indicateurs/IND-101/taux-progression?individus=${cible}`,
        })
      ).items,
    )
    const valeur101 = dernier(
      (
        await lire<{ items: PointValeur[] }>({
          app,
          path: `/indicateurs/IND-101/valeurs?individus=${cible}`,
        })
      ).items,
    )
    const date = valeur101?.date
    lignes.push('', `${cible} — dernier point ${date ?? '—'}`)
    lignes.push('  Contournement : un indicateur par opérateur')
    let sommeValeurs = 0
    let sommeCibles = 0
    // Opérateurs qui ont une valeur mais pas d'objectif calculable (objectifs
    // stricts : un territoire enfant sans objectif rend l'agrégat null).
    const sansObjectif: string[] = []
    const ratiosBruts: number[] = []
    for (const { indicateur, operateur } of OPERATEURS) {
      const valeurs = (
        await lire<{ items: PointValeur[] }>({
          app,
          path: `/indicateurs/${indicateur}/valeurs?individus=${cible}`,
        })
      ).items
      const valeur = valeurs.find((v) => v.date === date)?.valeur
      const taux = dernier(
        (
          await lire<{ items: PointTaux[] }>({
            app,
            path: `/indicateurs/${indicateur}/taux-progression?individus=${cible}`,
          })
        ).items,
      )
      sommeValeurs += valeur ?? 0
      sommeCibles += taux?.valeurCible ?? 0
      if (valeur !== undefined && !taux) sansObjectif.push(indicateur)
      const ratioBrut = taux ? (taux.valeur / taux.valeurCible) * 100 : undefined
      if (ratioBrut !== undefined) ratiosBruts.push(ratioBrut)
      lignes.push(
        `    ${operateur.padEnd(12)} ${indicateur}  valeur ${nombre(valeur).padStart(10)}` +
          `  objectif ${nombre(taux?.valeurCible).padStart(10)}` +
          `  taux ${pct(taux?.tauxProgression).padStart(9)}` +
          (ratioBrut !== undefined && ratioBrut > 100
            ? `  (non plafonné ${ratioBrut.toFixed(2)} %)`
            : ''),
      )
    }
    const { brut, sansRegional } = resultats.get(cible)!
    const moyenneSansPlafond =
      brut.tauxProgression === null
        ? null
        : ratiosBruts.reduce((acc, r) => acc + r, 0) / ratiosBruts.length
    lignes.push(
      `  COL-010 (moyenne pondérée des taux, pondérations 1)  : ${pct(brut.tauxProgression)}`,
      `  COL-010 avec IND-115 pondéré 0                       : ${pct(sansRegional?.tauxProgression)}`,
      `  Moyenne des taux sans plafond par opérateur (local)  : ${pct(moyenneSansPlafond)}`,
      '  Migration : IND-101 (territoire × opérateur)',
      `  IND-101 taux (Σ opérateurs / objectif territoire)    : ${pct(taux101?.tauxProgression)}` +
        `  (valeur ${nombre(taux101?.valeur)} / objectif ${nombre(taux101?.valeurCible)})`,
      sansObjectif.length > 0
        ? `  Taux de la somme recalculé sur IND-111..115          : null  (objectif agrégé absent pour ${sansObjectif.join(', ')})`
        : `  Taux de la somme recalculé sur IND-111..115          : ${pct(
            Math.min(100, (sommeValeurs / sommeCibles) * 100),
          )}  (Σ objectifs par opérateur ${nombre(sommeCibles)})`,
      `  IND-101 valeur marginale (tous opérateurs)           : ${nombre(valeur101?.valeur)}`,
      `  Σ valeurs IND-111..115                               : ${nombre(sommeValeurs)}  ` +
        (valeur101?.valeur === sommeValeurs ? '[égales]' : '[ÉCART]'),
    )
  }
  return lignes
}

const main = async () => {
  let lignes: string[] = []
  try {
    await prisma.$transaction(
      async (tx) =>
        runWithDb(tx, async () => {
          lignes = await comparer()
          // eslint-disable-next-line @typescript-eslint/only-throw-error -- sentinelle de rollback
          throw ROLLBACK
        }),
      { timeout: 600_000, maxWait: 10_000 },
    )
  } catch (error) {
    if (error !== ROLLBACK) throw error
  }
  console.log(
    'Contournement « collection d’opérateurs » (COL-010) vs dimension Opérateur (IND-101)',
  )
  for (const ligne of lignes) console.log(ligne)
}

await main()
await prisma.$disconnect()
