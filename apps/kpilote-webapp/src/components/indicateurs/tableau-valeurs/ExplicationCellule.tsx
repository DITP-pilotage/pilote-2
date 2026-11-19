import { type FonctionAgregation } from '@pilote/kpilote-shared/indicateur'
import {
  type CelluleValeur,
  type ExplicationCellule as Explication,
  type TermeExplication,
} from '@pilote/kpilote-shared/valeursCombinaison'
import { type ReactNode } from 'react'

import { type AxeTableau } from '@/lib/axes/tableauValeurs'
import { formatMoisAnneeLongFr, formatNumberFr } from '@/lib/format'

const FONCTION_LABEL: Record<FonctionAgregation, string> = {
  SUM: 'somme',
  AVG: 'moyenne',
  NONE: 'sans agrégation',
}

// La formule d'un agrégat : les termes qui ont une valeur, joints selon la fonction.
const formuleOf = ({
  termes,
  fonction,
  nomOf,
}: {
  termes: ReadonlyArray<TermeExplication>
  fonction: FonctionAgregation
  nomOf: (terme: TermeExplication) => string
}): string => {
  const comptes = termes.flatMap((terme) =>
    terme.valeur === null ? [] : [`${nomOf(terme)} ${formatNumberFr(terme.valeur)}`],
  )
  if (comptes.length === 0) return '∅'
  if (fonction === 'AVG') return `moyenne(${comptes.join(', ')})`
  return comptes.join(' + ')
}

export function ExplicationCellule({
  axes,
  explication,
  cellule,
  periode,
}: {
  axes: ReadonlyArray<AxeTableau>
  explication: Explication | null
  cellule: CelluleValeur | null
  periode: string | null
}) {
  if (!explication || !cellule || !periode) {
    return (
      <span className="text-text-muted">
        Cliquez sur une cellule pour voir d’où vient sa valeur : ses sources s’allument en bleu.
      </span>
    )
  }
  const mois = formatMoisAnneeLongFr(periode)
  switch (explication.kind) {
    case 'saisie':
      return (
        <span>
          Valeur saisie en {mois} : <strong>{formatNumberFr(explication.valeur)}</strong>. Une
          modalité feuille sur chaque axe : rien ne la calcule.
        </span>
      )
    case 'reportee':
      return (
        <span>
          Rien de saisi en {mois} : la dernière valeur saisie (
          {formatMoisAnneeLongFr(explication.date)}),{' '}
          <strong>{formatNumberFr(explication.valeur)}</strong>, est reportée.
        </span>
      )
    case 'manquante':
      return (
        <span className="text-warning">
          Pas encore de valeur en {mois} : cette combinaison n’en a qu’à des périodes suivantes.
        </span>
      )
    case 'absente':
      return (
        <span className="text-text-muted">
          Aucune valeur : cette combinaison n’existe pas pour cet individu. Elle ne compte ni comme
          0, ni comme une valeur manquante.
        </span>
      )
    case 'axe': {
      const axe = axes[explication.axeIndex]
      const nomOf = (terme: TermeExplication) =>
        axe?.tree.get(terme.ids[explication.axeIndex] ?? '')?.nom ?? ''
      return (
        <Agregat
          intro={
            <>
              On descend <b className="text-text">{axe?.nom}</b> (axe {explication.axeIndex + 1}, le
              dernier déclaré encore à préciser), en {FONCTION_LABEL[explication.fonction]} :
            </>
          }
          formule={formuleOf({ termes: explication.termes, fonction: explication.fonction, nomOf })}
          termes={explication.termes}
          nomOf={nomOf}
          cellule={cellule}
          dateCalcul={explication.date}
          periode={periode}
        />
      )
    }
    case 'individus': {
      const nomOf = (terme: TermeExplication) => terme.individu
      return (
        <Agregat
          intro={
            <>
              L’individu se calcule à partir de ses individus enfants, en{' '}
              {FONCTION_LABEL[explication.fonction]} :
            </>
          }
          formule={formuleOf({ termes: explication.termes, fonction: explication.fonction, nomOf })}
          termes={explication.termes}
          nomOf={nomOf}
          cellule={cellule}
          dateCalcul={explication.date}
          periode={periode}
        />
      )
    }
  }
}

function Agregat({
  intro,
  formule,
  termes,
  nomOf,
  cellule,
  dateCalcul,
  periode,
}: {
  intro: ReactNode
  formule: string
  termes: ReadonlyArray<TermeExplication>
  nomOf: (terme: TermeExplication) => string
  cellule: CelluleValeur
  dateCalcul: string
  periode: string
}) {
  const manquants = termes.filter((terme) => terme.source === 'manquante')
  const isReportee = dateCalcul !== periode
  return (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-xs text-text-muted">{intro}</span>
      <span className="font-mono text-xs">
        = {formule}
        {cellule.value === null ? null : (
          <strong className="text-sm"> = {formatNumberFr(cellule.value)}</strong>
        )}
      </span>
      <span className="text-xs text-text-muted">
        couverture {cellule.present}/{cellule.expected}
      </span>
      {isReportee ? (
        <span className="text-xs text-text-subtle">
          inchangée depuis {formatMoisAnneeLongFr(dateCalcul)}
        </span>
      ) : null}
      {manquants.length > 0 ? (
        <span className="text-xs text-warning">
          sans valeur à cette date : {manquants.map(nomOf).join(', ')}
        </span>
      ) : null}
    </span>
  )
}
