import { err, ok, type Result, ResultAsync } from 'neverthrow'
import { uuidv7 } from 'uuidv7'

import { type TopologieCube } from '@/dimension/buildGrapheCube'
import { cleCellule } from '@/dimension/cellule'
import { loadTopologieCube } from '@/dimension/queries/loadContexteResolution'
import {
  type DimensionIndicateur,
  dimensionsObjectifs,
  loadIndicateurDimensions,
} from '@/dimension/queries/loadIndicateurDimensions'
import { db } from '@/framework/persistence/dbStore'

// Résolution d'une cible d'écriture (`individu` historique ou `coordonnees`) en
// cellule de l'indicateur. Cf. dimensions-design.md « Écriture ».
//
// - Indicateur (ou sous-cube) mono-dimension : sémantique historique exacte —
//   l'individu doit exister et son référentiel être lié à l'indicateur, sinon
//   INDIVIDU_INCONNU ; l'écriture sur un nœud agrégé reste permise (D9).
// - Multi-dimension : on n'écrit que sur une cellule **feuille** (aucune
//   coordonnée éclatable), au plus un membre par dimension, chaque dimension
//   absente devant avoir une marginale NONE.
// - Périmètre (cloisonnement) : si le principal a des lignes de périmètre,
//   chaque dimension restreinte doit porter une coordonnée couverte (ET entre
//   dimensions, OU dans une dimension, descendants inclus).

export type CibleEcriture = {
  individu?: string | undefined
  coordonnees?: string[] | undefined
}

export type ErreurCellule =
  | { type: 'INDIVIDU_INCONNU'; individu: string }
  | { type: 'DIMENSION_NON_DECLAREE'; individu: string }
  | { type: 'COORDONNEES_EN_DOUBLE'; dimension: string }
  | { type: 'COORDONNEE_MANQUANTE'; dimension: string }
  | { type: 'CELLULE_AGREGEE'; individu: string }
  | { type: 'HORS_PERIMETRE'; individu: string }

export type CelluleResolue = {
  cle: string
  publicId: string
  coordonnees: Array<{ dimensionId: string; individuId: string }>
}

type MembreEcriture = {
  id: string
  publicId: string
  referentielId: string
  dimensionId: string
}

export type ContexteEcriture = {
  // Dimensions du sous-cube écrit (valeurs : toutes ; objectifs : celles qui les portent).
  dimensions: ReadonlyArray<DimensionIndicateur>
  multiDimension: boolean
  membreParPublicId: ReadonlyMap<string, MembreEcriture>
  niveauxLies: ReadonlySet<string>
  // Multi-dimension : enfants déclarés (pour le contrôle de feuille).
  topologie: TopologieCube | null
  // dimensionId → membres autorisés (descendants inclus). null = non restreint.
  perimetre: ReadonlyMap<string, ReadonlySet<string>> | null
}

const publicIdsDeCible = (cible: CibleEcriture): string[] =>
  cible.individu !== undefined ? [cible.individu] : (cible.coordonnees ?? [])

export const validerCible = (
  ctx: ContexteEcriture,
  cible: CibleEcriture,
): Result<CelluleResolue, ErreurCellule> => {
  const formeHistorique = cible.individu !== undefined
  const dimensionsSousCube = new Set(ctx.dimensions.map((d) => d.dimensionId))
  const parDimension = new Map<string, MembreEcriture>()

  for (const publicId of publicIdsDeCible(cible)) {
    const membre = ctx.membreParPublicId.get(publicId)
    if (!membre) return err({ type: 'INDIVIDU_INCONNU', individu: publicId })
    if (!dimensionsSousCube.has(membre.dimensionId)) {
      return err(
        formeHistorique
          ? { type: 'INDIVIDU_INCONNU', individu: publicId }
          : { type: 'DIMENSION_NON_DECLAREE', individu: publicId },
      )
    }
    if (!ctx.niveauxLies.has(membre.referentielId)) {
      return err({ type: 'INDIVIDU_INCONNU', individu: publicId })
    }
    if (parDimension.has(membre.dimensionId)) {
      const dimension = ctx.dimensions.find((d) => d.dimensionId === membre.dimensionId)!
      return err({ type: 'COORDONNEES_EN_DOUBLE', dimension: dimension.publicId })
    }
    parDimension.set(membre.dimensionId, membre)
  }

  if (ctx.multiDimension) {
    for (const dimension of ctx.dimensions) {
      const membre = parDimension.get(dimension.dimensionId)
      if (!membre) {
        if (dimension.fonctionAgregation !== 'NONE') {
          return err({ type: 'COORDONNEE_MANQUANTE', dimension: dimension.publicId })
        }
        continue
      }
      const fonctionNiveau = dimension.niveaux.find(
        (niveau) => niveau.referentielId === membre.referentielId,
      )?.fonctionAgregation
      const aDesEnfants = (ctx.topologie?.enfantsParMembre.get(membre.id)?.length ?? 0) > 0
      if (aDesEnfants && fonctionNiveau && fonctionNiveau !== 'NONE') {
        return err({ type: 'CELLULE_AGREGEE', individu: membre.publicId })
      }
    }
  }

  const ordonnes = ctx.dimensions
    .map((dimension) => parDimension.get(dimension.dimensionId))
    .filter((membre): membre is MembreEcriture => membre !== undefined)
  const publicId = ordonnes.map((membre) => membre.publicId).join('~')

  if (ctx.perimetre) {
    for (const [dimensionId, autorises] of ctx.perimetre) {
      const membre = parDimension.get(dimensionId)
      if (!membre || !autorises.has(membre.id)) {
        return err({ type: 'HORS_PERIMETRE', individu: publicId })
      }
    }
  }

  return ok({
    cle: cleCellule(ordonnes.map((membre) => membre.id)),
    publicId,
    coordonnees: ordonnes.map((membre) => ({
      dimensionId: membre.dimensionId,
      individuId: membre.id,
    })),
  })
}

const descendants = async (racines: ReadonlyArray<string>): Promise<Set<string>> => {
  const result = new Set(racines)
  let niveau = [...racines]
  while (niveau.length > 0) {
    const relations = await db().relation.findMany({
      where: { parentId: { in: niveau } },
      select: { childId: true },
    })
    niveau = relations.map((r) => r.childId).filter((id) => !result.has(id))
    for (const id of niveau) result.add(id)
  }
  return result
}

export const loadPerimetre = async ({
  indicateurId,
  principalId,
}: {
  indicateurId: string
  principalId: string
}): Promise<Map<string, Set<string>> | null> => {
  const permission = await db().indicateurPermission.findUnique({
    where: {
      principalId_indicateurId_action: { principalId, indicateurId, action: 'WRITE_DATA' },
    },
    select: { perimetreRestreint: true },
  })
  if (!permission?.perimetreRestreint) return null
  const lignes = await db().indicateurPermissionPerimetre.findMany({
    where: { indicateurId, principalId, action: 'WRITE_DATA' },
    select: { individu: { select: { id: true, referentiel: { select: { dimensionId: true } } } } },
  })
  // Fail-closed : restreint sans aucune ligne → aucune cellule autorisée.
  if (lignes.length === 0) return new Map([['', new Set<string>()]])
  const parDimension = new Map<string, string[]>()
  for (const { individu } of lignes) {
    const dimensionId = individu.referentiel.dimensionId
    parDimension.set(dimensionId, [...(parDimension.get(dimensionId) ?? []), individu.id])
  }
  return new Map(
    await Promise.all(
      [...parDimension].map(
        async ([dimensionId, ids]) => [dimensionId, await descendants(ids)] as const,
      ),
    ),
  )
}

export const loadContexteEcriture = async ({
  indicateurId,
  principalId,
  dimensions,
  multiDimension,
  topologie,
  cibles,
}: {
  indicateurId: string
  principalId: string
  dimensions: ReadonlyArray<DimensionIndicateur>
  multiDimension: boolean
  topologie: TopologieCube | null
  cibles: ReadonlyArray<CibleEcriture>
}): Promise<ContexteEcriture> => {
  const publicIds = [...new Set(cibles.flatMap(publicIdsDeCible))]
  const [individus, liens, perimetre] = await Promise.all([
    db().individu.findMany({
      where: { publicId: { in: publicIds } },
      select: {
        id: true,
        publicId: true,
        referentielId: true,
        referentiel: { select: { dimensionId: true } },
      },
    }),
    db().indicateurReferentiel.findMany({
      where: { indicateurId },
      select: { referentielId: true },
    }),
    loadPerimetre({ indicateurId, principalId }),
  ])
  return {
    dimensions,
    multiDimension,
    membreParPublicId: new Map(
      individus.map((individu) => [
        individu.publicId,
        {
          id: individu.id,
          publicId: individu.publicId,
          referentielId: individu.referentielId,
          dimensionId: individu.referentiel.dimensionId,
        },
      ]),
    ),
    niveauxLies: new Set(liens.map((lien) => lien.referentielId)),
    topologie,
    perimetre,
  }
}

// Crée au besoin les cellules (idempotent, concurrence-safe) et renvoie leur id
// par clé. Traitées par clé croissante pour éviter les interblocages entre lots.
export const ensureCellules = async ({
  indicateurId,
  cellules,
}: {
  indicateurId: string
  cellules: ReadonlyArray<CelluleResolue>
}): Promise<Map<string, string>> => {
  const parCle = new Map(cellules.map((cellule) => [cellule.cle, cellule]))
  const ids = new Map<string, string>()
  for (const cle of [...parCle.keys()].sort()) {
    const cellule = parCle.get(cle)!
    // SELECT puis INSERT … DO NOTHING puis relecture : pas de réécriture d'une
    // cellule existante à chaque lot (bloat / verrous), et sûr en concurrence.
    const where = { indicateurId_cle: { indicateurId, cle } }
    let ligne = await db().cellule.findUnique({ where, select: { id: true } })
    if (!ligne) {
      await db().cellule.createMany({
        data: [{ id: uuidv7(), indicateurId, cle }],
        skipDuplicates: true,
      })
      ligne = await db().cellule.findUniqueOrThrow({ where, select: { id: true } })
    }
    await db().celluleCoordonnee.createMany({
      data: cellule.coordonnees.map((c) => ({ celluleId: ligne.id, ...c })),
      skipDuplicates: true,
    })
    ids.set(cle, ligne.id)
  }
  return ids
}

export type SousCube = 'valeurs' | 'objectifs'

// Contexte d'écriture complet pour un sous-cube d'un indicateur.
export const loadContexteEcriturePourSousCube = async ({
  indicateurId,
  principalId,
  sousCube,
  cibles,
}: {
  indicateurId: string
  principalId: string
  sousCube: SousCube
  cibles: ReadonlyArray<CibleEcriture>
}): Promise<ContexteEcriture> => {
  const toutes = await loadIndicateurDimensions(indicateurId)
  const dimensions = sousCube === 'valeurs' ? toutes : dimensionsObjectifs(toutes)
  // Règle de feuille dès que l'indicateur est multi-dimension (même si le
  // sous-cube des objectifs n'a qu'une dimension) ; mono : sémantique historique.
  const multiDimension = toutes.length > 1
  const topologie = multiDimension ? await loadTopologieCube(dimensions) : null
  return loadContexteEcriture({
    indicateurId,
    principalId,
    dimensions,
    multiDimension,
    topologie,
    cibles,
  })
}

// Résout une cible unitaire. `creer` = upsert (cellule créée au besoin) ; sinon
// la cellule n'est que recherchée (delete idempotent : null si absente).
export const resoudreCelluleEcriture = ({
  indicateurId,
  principalId,
  sousCube,
  cible,
  creer,
}: {
  indicateurId: string
  principalId: string
  sousCube: SousCube
  cible: CibleEcriture
  creer: boolean
}): ResultAsync<{ celluleId: string | null; publicId: string }, ErreurCellule> =>
  ResultAsync.fromSafePromise(
    loadContexteEcriturePourSousCube({ indicateurId, principalId, sousCube, cibles: [cible] }),
  ).andThen((ctx) =>
    validerCible(ctx, cible).asyncAndThen((cellule) =>
      ResultAsync.fromSafePromise(
        creer
          ? ensureCellules({ indicateurId, cellules: [cellule] }).then(
              (ids) => ids.get(cellule.cle) ?? null,
            )
          : db()
              .cellule.findUnique({
                where: { indicateurId_cle: { indicateurId, cle: cellule.cle } },
                select: { id: true },
              })
              .then((ligne) => ligne?.id ?? null),
      ).map((celluleId) => ({ celluleId, publicId: cellule.publicId })),
    ),
  )
