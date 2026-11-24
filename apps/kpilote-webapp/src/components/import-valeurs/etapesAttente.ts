import {
  type CiblesSaisieApiModel,
  type DispositionValeurs,
  type EtapePlan,
  type TableauSource,
} from '@pilote/kpilote-shared/valeurImport'

import { pluralize } from './pluralize'

export type StatutEtapeAttente = 'TERMINEE' | 'EN_COURS' | 'A_VENIR'

export type EtapeAttente = {
  id: string
  label: string
  statut: StatutEtapeAttente
  // Résultat d'une étape terminée, ou ce qu'elle est en train de faire.
  detail: string
}

const MAX_DATES_CITEES = 4

const describeStructure = (valeurs: DispositionValeurs | undefined): string => {
  if (!valeurs) return 'Colonnes de l’individu, de la date et de la valeur repérées'
  if (valeurs.disposition === 'LIGNES') {
    return `Une ligne par valeur : date dans « ${valeurs.colonneDate} », valeur dans « ${valeurs.colonneValeur} »`
  }
  const colonnes = valeurs.colonnes.map((colonne) => colonne.colonne)
  const citees = colonnes.slice(0, MAX_DATES_CITEES).join(', ')
  const suite = colonnes.length > MAX_DATES_CITEES ? '…' : ''
  return `Les dates en colonnes (${citees}${suite})`
}

const describeRapprochements = ({
  resolus = 0,
  aVerifier = 0,
}: {
  resolus?: number | undefined
  aVerifier?: number | undefined
}): string => {
  const reconnus = `${resolus} ${pluralize({ count: resolus, singular: 'libellé reconnu', plural: 'libellés reconnus' })}`
  if (aVerifier === 0) return reconnus
  return `${reconnus}, ${aVerifier} à vérifier`
}

type EtapeStructure = Extract<EtapePlan, { etape: 'STRUCTURE' }>
type EtapeIndividus = Extract<EtapePlan, { etape: 'INDIVIDUS' }>
type EtapeAxe = Extract<EtapePlan, { etape: 'AXE' }>

type EtapeConnue = { id: string; label: string; enCours: string; termine: string | null }

// Les étapes dans l'ordre où le serveur les joue, avec le détail de celles qu'il
// a déjà terminées (`termine` nul : pas encore).
const listEtapesConnues = ({
  tableau,
  cibles,
  etapes,
}: {
  tableau: TableauSource
  cibles: Pick<CiblesSaisieApiModel, 'axes'>
  etapes: ReadonlyArray<EtapePlan>
}): EtapeConnue[] => {
  const terminees = etapes.filter((etape) => etape.statut === 'TERMINEE')
  const structure = terminees.find((etape): etape is EtapeStructure => etape.etape === 'STRUCTURE')
  const individus = terminees.find((etape): etape is EtapeIndividus => etape.etape === 'INDIVIDUS')
  const axes = terminees.filter((etape): etape is EtapeAxe => etape.etape === 'AXE')
  const nombreLignes = tableau.lignes.length
  const nombreColonnes = tableau.entetes.length

  return [
    {
      id: 'lecture',
      label: 'Lecture du fichier',
      enCours: 'Ouverture du fichier…',
      termine:
        `${nombreLignes} ${pluralize({ count: nombreLignes, singular: 'ligne', plural: 'lignes' })} et ` +
        `${nombreColonnes} ${pluralize({ count: nombreColonnes, singular: 'colonne lue', plural: 'colonnes lues' })}`,
    },
    {
      id: 'structure',
      label: 'Structure du tableau',
      enCours: 'Recherche des colonnes de l’individu, de la date et de la valeur…',
      termine: structure ? describeStructure(structure.valeurs) : null,
    },
    {
      id: 'individus',
      label: 'Individus',
      enCours: 'Rapprochement des libellés du fichier avec les individus…',
      termine: individus ? describeRapprochements(individus) : null,
    },
    ...cibles.axes.map((axe): EtapeConnue => {
      const etape = axes.find((terminee) => terminee.axe === axe.id)
      return {
        id: `axe-${axe.id}`,
        label: axe.nom,
        enCours: 'Rapprochement des libellés du fichier avec les modalités…',
        termine: etape ? describeRapprochements(etape) : null,
      }
    }),
    {
      id: 'preparation',
      label: 'Préparation du tableau',
      enCours: 'Mise au format de l’indicateur…',
      termine: null,
    },
  ]
}

// Étapes affichées pendant qu'Albert construit le plan. La première étape non
// terminée est en cours, les suivantes à venir : le serveur les joue dans l'ordre.
export const buildEtapesAttente = (params: {
  tableau: TableauSource
  cibles: Pick<CiblesSaisieApiModel, 'axes'>
  etapes: ReadonlyArray<EtapePlan>
}): EtapeAttente[] => {
  const connues = listEtapesConnues(params)
  const firstPending = connues.findIndex((etape) => etape.termine === null)
  return connues.map((etape, index): EtapeAttente => {
    const { id, label } = etape
    if (etape.termine !== null) return { id, label, statut: 'TERMINEE', detail: etape.termine }
    if (index === firstPending) return { id, label, statut: 'EN_COURS', detail: etape.enCours }
    return { id, label, statut: 'A_VENIR', detail: '' }
  })
}

// Part des étapes terminées, de 0 à 100.
export const progressionOf = (etapes: ReadonlyArray<EtapeAttente>): number => {
  if (etapes.length === 0) return 0
  const terminees = etapes.filter((etape) => etape.statut === 'TERMINEE').length
  return Math.round((terminees / etapes.length) * 100)
}
