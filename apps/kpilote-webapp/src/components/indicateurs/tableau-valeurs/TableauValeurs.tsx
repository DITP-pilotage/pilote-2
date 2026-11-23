import { TOUS_ID } from '@pilote/kpilote-shared/modaliteTree'
import {
  combinaisonKey,
  explainCellule,
  findContributions,
  resolveCellule,
} from '@pilote/kpilote-shared/valeursCombinaison'
import { Temporal } from '@js-temporal/polyfill'
import { useQuery } from '@tanstack/react-query'
import { FormulaBar } from '@pilote/kpilote-ui/FormulaBar'
import { SegmentedControl } from '@pilote/kpilote-ui/SegmentedControl'
import { useMemo, useState } from 'react'

import { CelluleReference } from '@/components/indicateurs/tableau-valeurs/CelluleReference'
import { ExplicationCellule } from '@/components/indicateurs/tableau-valeurs/ExplicationCellule'
import {
  type CelluleActive,
  TableauCroise,
} from '@/components/indicateurs/tableau-valeurs/TableauCroise'
import { TableauCroiseControls } from '@/components/indicateurs/tableau-valeurs/TableauCroiseControls'
import { VueLignes } from '@/components/indicateurs/tableau-valeurs/VueLignes'
import { referenceLinesOf } from '@/lib/axes/explicationCellule'
import {
  INITIAL_LAYOUT,
  initialCollapsed,
  type Layout,
  modalitesOf,
  syncFixedIds,
  type TableauValeursContext,
  toggleIn,
} from '@/lib/axes/tableauValeurs'
import { formatMonthYearShortFr } from '@/lib/format'
import { indicateurValeursQueryOptions } from '@/queries/indicateurs'

type View = 'croise' | 'lignes'

const VIEW_OPTIONS = [
  { value: 'croise', label: 'Tableau croisé' },
  { value: 'lignes', label: 'Lignes' },
] as const satisfies ReadonlyArray<{ value: View; label: string }>

const formatPeriode = (periode: string) => formatMonthYearShortFr(Temporal.PlainDate.from(periode))

export function TableauValeurs({
  context,
  indicateurId,
  individuId,
  nomOfIndividu,
  modalitesFixees,
}: {
  context: TableauValeursContext
  indicateurId: string
  individuId: string
  nomOfIndividu: (individuId: string) => string
  modalitesFixees: ReadonlyArray<string | null>
}) {
  const { axes, series, periodes, axeIndexByModalite } = context
  const [view, setView] = useState<View>('croise')
  const [layout, setLayout] = useState<Layout>(INITIAL_LAYOUT)
  const [periode, setPeriode] = useState(() => periodes.at(-1) ?? '')
  const [fixedIds, setFixedIds] = useState<ReadonlyArray<string>>(() =>
    axes.map((_, index) => modalitesFixees[index] ?? TOUS_ID),
  )
  const [collapsedByAxe, setCollapsedByAxe] = useState<Record<string, ReadonlySet<string>>>(() =>
    Object.fromEntries(axes.map((axe) => [axe.id, initialCollapsed(axe.tree)])),
  )
  const [active, setActive] = useState<CelluleActive | null>(null)
  const individuNom = nomOfIndividu(individuId)
  const individu = useMemo(() => ({ id: individuId, nom: individuNom }), [individuId, individuNom])

  // Un sélecteur de la page change : l'axe concerné suit, sans perdre le reste du tableau.
  const [previousModalites, setPreviousModalites] = useState(modalitesFixees)
  if (previousModalites.join(',') !== modalitesFixees.join(',')) {
    setPreviousModalites(modalitesFixees)
    setFixedIds(syncFixedIds({ fixedIds, previous: previousModalites, next: modalitesFixees }))
    setActive(null)
  }

  const celluleOf = ({ ids, periode: date }: CelluleActive) =>
    resolveCellule({ valeurs: series.get(combinaisonKey(ids))?.valeurs, periode: date })
  const activeCellule = active ? celluleOf(active) : null
  // Le cube ne porte pas les contributions : on lit la série complète de la seule combinaison
  // cliquée, quand sa valeur est calculée.
  const isCalculee = activeCellule?.point?.type === 'derivee'
  const { data: detail } = useQuery({
    ...indicateurValeursQueryOptions(indicateurId, individuId, modalitesOf(active?.ids ?? [])),
    enabled: isCalculee,
  })
  const contributions =
    detail && activeCellule?.point
      ? findContributions({ valeurs: detail.items, date: activeCellule.point.date })
      : null
  const explication =
    active && activeCellule
      ? explainCellule({
          cellule: activeCellule,
          ids: active.ids,
          axeIndexByModalite,
          contributions,
        })
      : null
  const precedents = new Set(
    explication?.kind === 'axe' ? explication.termes.map((terme) => combinaisonKey(terme.ids)) : [],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-border px-6 py-3">
        <SegmentedControl
          aria-label="Présentation des valeurs"
          value={view}
          onValueChange={(next) => {
            setView(next)
            setActive(null)
          }}
          options={VIEW_OPTIONS}
        />
        {view === 'croise' ? (
          <TableauCroiseControls
            axes={axes}
            layout={layout}
            periodes={periodes}
            periode={periode}
            fixedIds={fixedIds}
            formatPeriode={formatPeriode}
            onLayoutChange={(next) => {
              setLayout(next)
              setActive(null)
            }}
            onPeriodeChange={(next) => {
              setPeriode(next)
              setActive(null)
            }}
            onFixedChange={({ index, id }) => {
              setActive(null)
              setFixedIds((current) =>
                current.map((fixedId, position) => (position === index ? id : fixedId)),
              )
            }}
          />
        ) : null}
      </div>

      <FormulaBar
        reference={
          active ? (
            <CelluleReference
              lines={referenceLinesOf({ axes, ids: active.ids })}
              periode={formatPeriode(active.periode)}
            />
          ) : (
            'Aucune cellule'
          )
        }
      >
        <ExplicationCellule
          axes={axes}
          explication={explication}
          cellule={activeCellule}
          periode={active?.periode ?? null}
          nomOfIndividu={nomOfIndividu}
        />
      </FormulaBar>

      {view === 'croise' ? (
        <TableauCroise
          axes={axes}
          layout={layout}
          periodes={periodes}
          periode={periode}
          fixedIds={fixedIds}
          collapsedByAxe={collapsedByAxe}
          active={active}
          precedents={precedents}
          celluleOf={celluleOf}
          formatPeriode={formatPeriode}
          onToggle={({ axeId, id }) =>
            setCollapsedByAxe((current) => ({
              ...current,
              [axeId]: toggleIn({ set: current[axeId] ?? new Set(), id }),
            }))
          }
          onActivate={setActive}
        />
      ) : (
        <VueLignes context={context} individu={individu} onActivate={setActive} />
      )}
    </div>
  )
}
