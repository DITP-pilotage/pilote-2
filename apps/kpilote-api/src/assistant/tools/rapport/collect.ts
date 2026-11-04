import {
  MAX_PERIMETRE_INDIVIDUS,
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
import { formatDate, formatEcart, formatTaux, formatValeur } from '@/assistant/tools/rapport/format'
import { type Collected } from '@/assistant/tools/rapport/writeRapport'
import { type ToolExecuteOptions } from '@/assistant/tools/toolDefinition'

// Les données passent par les outils de données : mêmes règles d'accès, mêmes libellés.
// Le sous-agent ne reçoit que ce que son gabarit écrit, déjà formaté.

export const LAST_POINTS = 6

const named = (entity: EntityRef): string => `${entity.nom} (${entity.id})`

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
    referentiel: item.referentiel.nom,
    mediane: formatValeur(item.mediane, unite),
  }))

/** Le plus récent de chaque type : l'encart résume, il ne retrace pas l'historique. */
const latestCommentaires = (output: CommentairesOutput) =>
  output.groupes.flatMap((groupe) => {
    const latest = groupe.versions[0]
    return latest ? [{ type: groupe.type, date: formatDate(latest.date), texte: latest.texte }] : []
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
      description: synthese.indicateur.description,
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

  const contributions = synthese.contributions.slice(0, MAX_PERIMETRE_INDIVIDUS)
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
      description: synthese.collection.description,
      individu: named(synthese.individu),
      tauxProgression: formatTaux(synthese.tauxProgression),
      indicateurs: contributions.map((contribution, index) => {
        const detail = details[index]
        const row = detail?.individus[0]
        const unite = detail?.indicateur?.unite ?? null
        return {
          indicateur: named(contribution.indicateur),
          ponderation: contribution.ponderation,
          tauxProgression: formatTaux(contribution.tauxProgression),
          derniereValeur: dated(row?.derniereValeur ?? null, unite, 'non renseignée'),
          objectif: dated(row?.objectif ?? null, unite, 'non renseigné'),
          ecartMediane: formatEcart(row?.ecartMediane ?? null, unite),
        }
      }),
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
        indicateurs: synthese.contributions
          .slice(0, MAX_PERIMETRE_INDIVIDUS)
          .map((contribution) => ({
            indicateur: named(contribution.indicateur),
            tauxProgression: formatTaux(contribution.tauxProgression),
          })),
      })),
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
