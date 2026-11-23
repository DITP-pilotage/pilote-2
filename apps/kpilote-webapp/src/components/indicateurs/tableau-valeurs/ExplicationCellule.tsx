import {
  type CelluleValeur,
  type ExplicationCellule as Explication,
  type TermeExplication,
} from '@pilote/kpilote-shared/valeursCombinaison'

import { AgregatExplication } from '@/components/indicateurs/tableau-valeurs/AgregatExplication'
import { orderTermes } from '@/lib/axes/explicationCellule'
import { type AxeTableau } from '@/lib/axes/tableauValeurs'
import { formatMoisAnneeLongFr, formatNumberFr } from '@/lib/format'

export function ExplicationCellule({
  axes,
  explication,
  cellule,
  periode,
  nomOfIndividu,
}: {
  axes: ReadonlyArray<AxeTableau>
  explication: Explication | null
  cellule: CelluleValeur | null
  periode: string | null
  nomOfIndividu: (individuId: string) => string
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
    case 'chargement':
      return <span className="text-text-muted">Chargement des contributions…</span>
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
        <AgregatExplication
          fonction={explication.fonction}
          sujet={`${explication.termes.length} modalités de ${axe?.nom ?? ''}`}
          precision={`axe ${explication.axeIndex + 1}, le dernier déclaré encore à préciser`}
          termes={orderTermes({
            termes: explication.termes,
            fonction: explication.fonction,
            nomOf,
          })}
          cellule={cellule}
          dateCalcul={explication.date}
          periode={periode}
        />
      )
    }
    case 'individus':
      return (
        <AgregatExplication
          fonction={explication.fonction}
          sujet={`${explication.termes.length} individus enfants`}
          termes={orderTermes({
            termes: explication.termes,
            fonction: explication.fonction,
            nomOf: (terme) => nomOfIndividu(terme.individu),
          })}
          cellule={cellule}
          dateCalcul={explication.date}
          periode={periode}
        />
      )
  }
}
