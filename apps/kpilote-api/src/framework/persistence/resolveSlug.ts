import { SLUG_BASE_MAX_LENGTH } from '@pilote/kpilote-shared/slug'

import { db } from '@/framework/persistence/dbStore'

// Entités dont l'identifiant public est attribué par le serveur. Les autres
// (référentiel, individu, widget) reçoivent le leur du client, par PUT.
export type EntiteSluggee = 'collection' | 'indicateur'

// Verrou consultatif porté par la transaction : deux créations concurrentes
// liraient sinon le même ensemble de slugs et retiendraient le même suffixe. Un
// retry sur violation d'unicité ne suffirait pas — sous Postgres, l'erreur
// avorte la transaction courante.
const verrouillerNumerotation = async (entite: EntiteSluggee): Promise<void> => {
  await db().$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`slug:${entite}`}))`
}

const chargerSlugsProches = async (entite: EntiteSluggee, racine: string): Promise<string[]> => {
  const where = { publicId: { startsWith: racine, mode: 'insensitive' as const } }
  const lignes =
    entite === 'indicateur'
      ? await db().indicateur.findMany({ where, select: { publicId: true } })
      : await db().collection.findMany({ where, select: { publicId: true } })
  return lignes.map((ligne) => ligne.publicId)
}

// Le premier arrivé garde le slug nu, les suivants sont suffixés : `bilan`,
// `bilan-2`, `bilan-3`. On repart du plus grand suffixe pris plutôt que du
// premier trou libre, pour ne jamais réattribuer l'identifiant d'une entité
// supprimée — les liens partagés qui le portent resteraient sinon vivants.
export const resolveSlug = async ({
  entite,
  base,
}: {
  entite: EntiteSluggee
  base: string
}): Promise<string> => {
  const racine = base.slice(0, SLUG_BASE_MAX_LENGTH)
  await verrouillerNumerotation(entite)
  const existants = await chargerSlugsProches(entite, racine)

  if (!existants.some((slug) => slug.toLowerCase() === racine.toLowerCase())) return racine

  const motif = new RegExp(`^${racine}-(\\d+)$`, 'i')
  const numerosPris = existants
    .map((slug) => motif.exec(slug)?.[1])
    .filter((numero) => numero !== undefined)
    .map(Number)
  return `${racine}-${Math.max(1, ...numerosPris) + 1}`
}
