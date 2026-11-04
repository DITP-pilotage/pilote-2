import {
  type CommentairesOutput,
  type DatedValue,
  type EntityRef,
  type Perimetre,
  type RapportSujet,
  type SyntheseIndicateurOutput,
} from '@pilote/kpilote-shared/assistant/tools'

import { findReadableCollection } from '@/assistant/tools/entityLookups'
import { getCommentaires } from '@/assistant/tools/getCommentaires'
import { getEvolutionIndicateur } from '@/assistant/tools/getEvolutionIndicateur'
import { getSyntheseCollection } from '@/assistant/tools/getSyntheseCollection'
import { getSyntheseIndicateur } from '@/assistant/tools/getSyntheseIndicateur'
import { resolvePerimetre } from '@/assistant/tools/perimetre'
import {
  formatCitation,
  formatDate,
  formatEcart,
  formatPonderation,
  formatTaux,
  formatValeur,
} from '@/assistant/tools/rapport/format'
import { type Collected } from '@/assistant/tools/rapport/writeRapport'
import { type ToolExecuteOptions } from '@/assistant/tools/toolDefinition'

// Les données passent par les outils de données : mêmes règles d'accès, mêmes libellés.
// Le sous-agent ne reçoit que ce que son gabarit écrit, déjà formaté.

export const LAST_POINTS = 6
export const MAX_INDICATEURS = 20

const MAX_NAME = 200
const MAX_DESCRIPTION = 500
const MAX_COMMENTAIRE = 1000

const named = (entity: EntityRef): string =>
  `${formatCitation(entity.nom, MAX_NAME)} (${entity.id})`

const description = (text: string | null): string | null =>
  text === null ? null : formatCitation(text, MAX_DESCRIPTION)

/** Les contributions les plus lourdes d'abord : une liste tronquée garde ce qui pèse. */
const heaviest = <T extends { ponderation: number }>(contributions: ReadonlyArray<T>): T[] =>
  [...contributions].sort((a, b) => b.ponderation - a.ponderation).slice(0, MAX_INDICATEURS)

const indicateursTruncation = (shown: number, total: number) =>
  total > shown ? { indicateursTronques: `${shown} indicateurs sur ${total}` } : {}

const dated = (value: DatedValue | null, unite: string | null, missing: string): string =>
  value ? `${formatValeur(value.valeur, unite)} au ${formatDate(value.date)}` : missing

const individuRow = (row: SyntheseIndicateurOutput['individus'][number], unite: string | null) => ({
  individu: named(row.individu),
  derniereValeur: dated(row.derniereValeur, unite, 'non renseignée'),
  objectif: dated(row.objectif, unite, 'non renseigné'),
  tauxProgression: formatTaux(row.tauxProgression),
  variation: formatEcart(row.variation, unite),
  ecartMediane: formatEcart(row.ecartMediane, unite),
})

const medianes = (synthese: SyntheseIndicateurOutput, unite: string | null) =>
  synthese.valeursRemarquables.map((item) => ({
    referentiel: formatCitation(item.referentiel.nom, MAX_NAME),
    mediane: formatValeur(item.mediane, unite),
  }))

/** Le plus récent de chaque type : l'encart résume, il ne retrace pas l'historique. */
const latestCommentaires = (output: CommentairesOutput) =>
  output.groupes.flatMap((groupe) => {
    const latest = groupe.versions[0]
    return latest
      ? [
          {
            type: groupe.type,
            date: formatDate(latest.date),
            texte: formatCitation(latest.texte, MAX_COMMENTAIRE),
          },
        ]
      : []
  })

const truncation = (shown: number, total: number | undefined) =>
  total !== undefined && total > shown
    ? { perimetreTronque: `${shown} individus comparés sur ${total}` }
    : {}

const tooFew = (count: number, notFound: string[]): Collected => ({
  needsClarification: `Une comparaison demande au moins deux individus lisibles ; le périmètre n'en désigne que ${count}${notFound.length > 0 ? ` (introuvables : ${notFound.join(', ')})` : ''}.`,
})

const collectSyntheseIndicateur = async (
  indicateurId: string,
  individuId: string,
  options: ToolExecuteOptions,
): Promise<Collected> => {
  const synthese = await getSyntheseIndicateur.execute({ indicateurId, individuId }, options)
  const row = synthese.individus[0]
  if (!synthese.indicateur || !row) {
    return { notFound: synthese.notFound.length > 0 ? synthese.notFound : [individuId] }
  }
  const { unite } = synthese.indicateur
  const [evolution, commentaires] = await Promise.all([
    getEvolutionIndicateur.execute({ indicateurId, individuId }, options),
    getCommentaires.execute({ cible: 'INDICATEUR', indicateurId, individuId }, options),
  ])
  return {
    donnees: {
      indicateur: named(synthese.indicateur),
      description: description(synthese.indicateur.description),
      ...individuRow(row, unite),
      medianes: medianes(synthese, unite),
      dernieresValeurs: evolution.points
        .slice(-LAST_POINTS)
        .map((point) => dated(point, unite, 'non renseignée')),
      commentaires: latestCommentaires(commentaires),
    },
  }
}

const collectSyntheseCollection = async (
  collectionId: string,
  individuId: string,
  options: ToolExecuteOptions,
): Promise<Collected> => {
  const synthese = await getSyntheseCollection.execute({ collectionId, individuId }, options)
  if (!synthese.collection || !synthese.individu) return { notFound: synthese.notFound }

  const contributions = heaviest(synthese.contributions)
  const [details, commentaires] = await Promise.all([
    Promise.all(
      contributions.map((contribution) =>
        getSyntheseIndicateur.execute(
          { indicateurId: contribution.indicateur.id, individuId },
          options,
        ),
      ),
    ),
    getCommentaires.execute({ cible: 'COLLECTION', collectionId }, options),
  ])
  return {
    donnees: {
      collection: named(synthese.collection),
      description: description(synthese.collection.description),
      individu: named(synthese.individu),
      tauxProgression: formatTaux(synthese.tauxProgression),
      indicateurs: contributions.map((contribution, index) => {
        const detail = details[index]
        const row = detail?.individus[0]
        const unite = detail?.indicateur?.unite ?? null
        return {
          indicateur: named(contribution.indicateur),
          ponderation: formatPonderation(contribution.ponderation),
          tauxProgression: formatTaux(contribution.tauxProgression),
          derniereValeur: dated(row?.derniereValeur ?? null, unite, 'non renseignée'),
          objectif: dated(row?.objectif ?? null, unite, 'non renseigné'),
          ecartMediane: formatEcart(row?.ecartMediane ?? null, unite),
        }
      }),
      ...indicateursTruncation(contributions.length, synthese.contributions.length),
      ...(synthese.notFound.length > 0 ? { indicateursNonLisibles: synthese.notFound.length } : {}),
      commentaires: latestCommentaires(commentaires),
    },
  }
}

export const collectSynthese = (
  { sujet, individuId }: { sujet: RapportSujet; individuId: string },
  options: ToolExecuteOptions,
): Promise<Collected> =>
  sujet.type === 'COLLECTION'
    ? collectSyntheseCollection(sujet.collectionId, individuId, options)
    : collectSyntheseIndicateur(sujet.indicateurId, individuId, options)

const COMMENTAIRE_TYPES = ['Commentaire', 'Niveau de confiance']

const collectComparaisonIndicateur = async (
  indicateurId: string,
  perimetre: Perimetre,
  options: ToolExecuteOptions,
): Promise<Collected> => {
  const synthese = await getSyntheseIndicateur.execute({ indicateurId, perimetre }, options)
  if (!synthese.indicateur) return { notFound: synthese.notFound }
  if (synthese.individus.length < 2) return tooFew(synthese.individus.length, synthese.notFound)

  const { unite } = synthese.indicateur
  const commentaires = await Promise.all(
    synthese.individus.map((row) =>
      getCommentaires.execute(
        { cible: 'INDICATEUR', indicateurId, individuId: row.individu.id },
        options,
      ),
    ),
  )
  return {
    donnees: {
      indicateur: named(synthese.indicateur),
      individus: synthese.individus.map((row, index) => ({
        ...individuRow(row, unite),
        commentaires: latestCommentaires(
          commentaires[index] ?? { groupes: [], notFound: [] },
        ).filter((commentaire) => COMMENTAIRE_TYPES.includes(commentaire.type)),
      })),
      medianes: medianes(synthese, unite),
      ...truncation(synthese.individus.length, synthese.total),
    },
  }
}

const collectComparaisonCollection = async (
  collectionId: string,
  perimetre: Perimetre,
  options: ToolExecuteOptions,
): Promise<Collected> => {
  const collection = await findReadableCollection(collectionId)
  if (!collection) return { notFound: [collectionId] }
  const cible = await resolvePerimetre(perimetre)
  if (cible.individus.length < 2) return tooFew(cible.individus.length, cible.notFound)

  const syntheses = await Promise.all(
    cible.individus.map((individu) =>
      getSyntheseCollection.execute({ collectionId, individuId: individu.id }, options),
    ),
  )
  return {
    donnees: {
      collection: named({ id: collection.id, nom: collection.nom }),
      individus: syntheses.map((synthese, index) => ({
        individu: named(synthese.individu ?? cible.individus[index] ?? { id: '', nom: '' }),
        tauxProgression: formatTaux(synthese.tauxProgression),
        indicateurs: heaviest(synthese.contributions).map((contribution) => ({
          indicateur: named(contribution.indicateur),
          tauxProgression: formatTaux(contribution.tauxProgression),
        })),
      })),
      ...indicateursTruncation(
        Math.min(syntheses[0]?.contributions.length ?? 0, MAX_INDICATEURS),
        syntheses[0]?.contributions.length ?? 0,
      ),
      ...truncation(cible.individus.length, cible.truncated ? cible.total : undefined),
    },
  }
}

export const collectComparaison = (
  { sujet, perimetre }: { sujet: RapportSujet; perimetre: Perimetre },
  options: ToolExecuteOptions,
): Promise<Collected> =>
  sujet.type === 'COLLECTION'
    ? collectComparaisonCollection(sujet.collectionId, perimetre, options)
    : collectComparaisonIndicateur(sujet.indicateurId, perimetre, options)
