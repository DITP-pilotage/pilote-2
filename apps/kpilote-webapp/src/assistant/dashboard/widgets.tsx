import type { DashboardWidget } from '@pilote/kpilote-shared/assistant/dashboard'
import type { UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { DataTable } from '@pilote/kpilote-ui/DataTable'
import { ProgressBar } from '@pilote/kpilote-ui/ProgressBar'
import { queryOptions, useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'

import {
  fetchSyntheseIndividus,
  fetchTauxProgressionForIndicateur,
  fetchValeursForIndicateur,
} from '@/api/indicateurs'
import { WidgetRenderer } from '@/components/widgets/WidgetRenderer'
import {
  formatDateFr,
  formatMonthYearShortFr,
  formatNumberAvecUniteFr,
  formatNumberFr,
  formatVariationAvecUniteFr,
} from '@/lib/format'
import { collectionTauxProgressionQueryOptions } from '@/queries/collections'
import {
  indicateurQueryOptions,
  indicateurTauxProgressionQueryOptions,
  indicateurValeursQueryOptions,
  indicateurValeursRemarquablesQueryOptions,
} from '@/queries/indicateurs'
import { referentielQueryOptions } from '@/queries/referentiels'
import { DEFAULT_STALE_TIME } from '@/queries/utils'

type Labels = Record<string, string>
type WidgetOf<T extends DashboardWidget['type']> = Extract<DashboardWidget, { type: T }>

const labelOf = (labels: Labels, id: string): string => labels[id] ?? id

const latest = <T extends { date: string }>(items: ReadonlyArray<T>): T | undefined =>
  items.reduce<T | undefined>(
    (last, item) => (!last || item.date > last.date ? item : last),
    undefined,
  )

const taux = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : `${formatNumberFr(Math.round(value))} %`

const valeur = (value: number | null | undefined, unite: UniteIndicateurApiModel | null) =>
  value === null || value === undefined ? '—' : formatNumberAvecUniteFr(value, unite)

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <h4 className="m-0 text-xs font-bold tracking-wide text-text-subtle uppercase">{title}</h4>
      {children}
    </section>
  )
}

function Kpi({
  value,
  caption,
  progress,
}: {
  value: string
  caption?: string
  progress?: number | null | undefined
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="m-0 text-2xl font-bold text-text">{value}</p>
      {caption && <p className="m-0 text-xs text-text-subtle">{caption}</p>}
      {progress !== null && progress !== undefined && (
        <ProgressBar
          value={Math.max(0, Math.min(100, progress))}
          label={`Taux de progression : ${taux(progress)}`}
        />
      )}
    </div>
  )
}

function KpiIndicateur({ widget, labels }: { widget: WidgetOf<'kpi_indicateur'>; labels: Labels }) {
  const [{ data: indicateur }, { data: valeurs }, { data: points }] = useSuspenseQueries({
    queries: [
      indicateurQueryOptions(widget.indicateurId),
      indicateurValeursQueryOptions(widget.indicateurId, widget.individuId),
      indicateurTauxProgressionQueryOptions(widget.indicateurId, widget.individuId),
    ],
  })
  const derniere = latest(valeurs.items)
  const point = latest(points.items)
  return (
    <Panel
      title={`${labelOf(labels, widget.indicateurId)} — ${labelOf(labels, widget.individuId)}`}
    >
      <Kpi
        value={valeur(derniere?.valeur, indicateur.unite)}
        caption={[
          derniere && `au ${formatDateFr(derniere.date)}`,
          point &&
            `objectif ${valeur(point.valeurCible, indicateur.unite)} au ${formatDateFr(point.dateCible)}`,
        ]
          .filter(Boolean)
          .join(' · ')}
        progress={point?.tauxProgression}
      />
    </Panel>
  )
}

function KpiCollection({ widget, labels }: { widget: WidgetOf<'kpi_collection'>; labels: Labels }) {
  const { data } = useSuspenseQuery(
    collectionTauxProgressionQueryOptions({
      collectionId: widget.collectionId,
      individu: widget.individuId,
    }),
  )
  return (
    <Panel
      title={`${labelOf(labels, widget.collectionId)} — ${labelOf(labels, widget.individuId)}`}
    >
      <Kpi
        value={taux(data.tauxProgression)}
        caption="Taux de progression pondéré"
        progress={data.tauxProgression}
      />
    </Panel>
  )
}

function EvolutionIndicateur({
  widget,
  labels,
}: {
  widget: WidgetOf<'evolution_indicateur'>
  labels: Labels
}) {
  const { data: indicateur } = useSuspenseQuery(indicateurQueryOptions(widget.indicateurId))
  const series = useSuspenseQueries({
    queries: widget.individuIds.map((individuId) =>
      indicateurValeursQueryOptions(widget.indicateurId, individuId),
    ),
  })
  const dates = [
    ...new Set(series.flatMap(({ data }) => data.items.map((item) => item.date))),
  ].sort()
  const option = {
    grid: { top: 40, right: 24, bottom: 32, left: 64 },
    legend: { top: 0 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: dates.map((date) => formatMonthYearShortFr(date)),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value: number) => formatNumberAvecUniteFr(value, indicateur.unite) },
    },
    series: series.map(({ data }, index) => {
      const byDate = new Map(data.items.map((item) => [item.date, item.valeur]))
      const individuId = widget.individuIds[index] ?? ''
      return {
        name: labelOf(labels, individuId),
        type: 'line',
        connectNulls: true,
        data: dates.map((date) => byDate.get(date) ?? null),
      }
    }),
  }
  return (
    <Panel title={labelOf(labels, widget.indicateurId)}>
      <ReactECharts option={option} style={{ height: 280 }} notMerge />
    </Panel>
  )
}

const tableauQueryOptions = (indicateurId: string, individuIds: string[]) =>
  queryOptions({
    queryKey: ['assistant-dashboard', 'tableau', indicateurId, individuIds],
    queryFn: () =>
      Promise.all([
        fetchValeursForIndicateur(indicateurId, { individus: individuIds, dateTrunc: 'month' }),
        fetchTauxProgressionForIndicateur(indicateurId, { individus: individuIds }),
        fetchSyntheseIndividus(indicateurId, { individus: individuIds, dateTrunc: 'month' }),
      ]),
    staleTime: DEFAULT_STALE_TIME,
  })

function TableauIndividus({
  widget,
  labels,
}: {
  widget: WidgetOf<'tableau_individus'>
  labels: Labels
}) {
  const [{ data: indicateur }, { data: tableau }] = useSuspenseQueries({
    queries: [
      indicateurQueryOptions(widget.indicateurId),
      tableauQueryOptions(widget.indicateurId, widget.individuIds),
    ],
  })
  const [valeurs, points, synthese] = tableau
  const { unite } = indicateur
  const rows = widget.individuIds.map((individuId) => ({
    individuId,
    derniere: latest(valeurs.items.filter((item) => item.individu === individuId)),
    point: latest(points.items.filter((item) => item.individu === individuId)),
    synthese: synthese.items.find((item) => item.individu === individuId),
  }))
  return (
    <Panel title={labelOf(labels, widget.indicateurId)}>
      <DataTable
        rows={rows}
        getRowKey={(row) => row.individuId}
        columns={[
          { key: 'individu', header: 'Individu', cell: (row) => labelOf(labels, row.individuId) },
          {
            key: 'valeur',
            header: 'Dernière valeur',
            cell: (row) => valeur(row.derniere?.valeur, unite),
          },
          {
            key: 'objectif',
            header: 'Objectif',
            cell: (row) => valeur(row.point?.valeurCible, unite),
          },
          {
            key: 'taux',
            header: 'Taux de progression',
            cell: (row) => taux(row.point?.tauxProgression),
          },
          {
            key: 'ecart',
            header: 'Écart à la médiane',
            cell: (row) =>
              row.synthese?.ecartMediane === null || row.synthese?.ecartMediane === undefined
                ? '—'
                : formatVariationAvecUniteFr(row.synthese.ecartMediane, unite),
          },
        ]}
      />
    </Panel>
  )
}

function ContributionsCollection({
  widget,
  labels,
}: {
  widget: WidgetOf<'contributions_collection'>
  labels: Labels
}) {
  const { data } = useSuspenseQuery(
    collectionTauxProgressionQueryOptions({
      collectionId: widget.collectionId,
      individu: widget.individuId,
    }),
  )
  // Un indicateur que l'utilisateur ne lit pas n'a pas de libellé : il n'est pas détaillé.
  const rows = data.contributions.filter((contribution) => contribution.indicateur in labels)
  return (
    <Panel
      title={`${labelOf(labels, widget.collectionId)} — ${labelOf(labels, widget.individuId)}`}
    >
      <DataTable
        rows={rows}
        getRowKey={(row) => row.indicateur}
        columns={[
          {
            key: 'indicateur',
            header: 'Indicateur',
            cell: (row) => labelOf(labels, row.indicateur),
          },
          {
            key: 'ponderation',
            header: 'Pondération',
            cell: (row) => formatNumberFr(row.ponderation),
          },
          { key: 'taux', header: 'Taux de progression', cell: (row) => taux(row.tauxProgression) },
        ]}
      />
    </Panel>
  )
}

function ValeursRemarquables({
  widget,
  labels,
}: {
  widget: WidgetOf<'valeurs_remarquables'>
  labels: Labels
}) {
  const [{ data: indicateur }, { data }] = useSuspenseQueries({
    queries: [
      indicateurQueryOptions(widget.indicateurId),
      indicateurValeursRemarquablesQueryOptions(widget.indicateurId, widget.referentielId),
    ],
  })
  const item = data.items.find(({ referentiel }) => referentiel === widget.referentielId)
  const stats = [
    ['Minimum', item?.min],
    ['Médiane', item?.mediane],
    ['Maximum', item?.max],
  ] as const
  return (
    <Panel
      title={`${labelOf(labels, widget.indicateurId)} — ${labelOf(labels, widget.referentielId)}`}
    >
      <dl className="m-0 grid grid-cols-3 gap-3">
        {stats.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="text-xs text-text-subtle">{label}</dt>
            <dd className="m-0 text-lg font-bold text-text">{valeur(value, indicateur.unite)}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}

function CarteIndicateur({
  widget,
  labels,
}: {
  widget: WidgetOf<'carte_indicateur'>
  labels: Labels
}) {
  const { data: referentiel } = useSuspenseQuery(referentielQueryOptions(widget.referentielId))
  const carte = referentiel.widgets.find((candidate) => candidate.type.startsWith('carte-france-'))
  if (!carte) return null
  return (
    <Panel
      title={`${labelOf(labels, widget.indicateurId)} — ${labelOf(labels, widget.referentielId)}`}
    >
      <WidgetRenderer
        widget={carte}
        indicateurId={widget.indicateurId}
        referentielId={widget.referentielId}
      />
    </Panel>
  )
}

export function DashboardWidgetView({
  widget,
  labels,
}: {
  widget: DashboardWidget
  labels: Labels
}) {
  switch (widget.type) {
    case 'kpi_indicateur':
      return <KpiIndicateur widget={widget} labels={labels} />
    case 'kpi_collection':
      return <KpiCollection widget={widget} labels={labels} />
    case 'evolution_indicateur':
      return <EvolutionIndicateur widget={widget} labels={labels} />
    case 'tableau_individus':
      return <TableauIndividus widget={widget} labels={labels} />
    case 'contributions_collection':
      return <ContributionsCollection widget={widget} labels={labels} />
    case 'valeurs_remarquables':
      return <ValeursRemarquables widget={widget} labels={labels} />
    case 'carte_indicateur':
      return <CarteIndicateur widget={widget} labels={labels} />
    case 'titre_section':
      return (
        <div className="flex flex-col gap-1 pt-2">
          <h4 className="m-0 text-[17px] font-bold text-text">{widget.titre}</h4>
          {widget.description && (
            <p className="m-0 text-sm text-text-subtle">{widget.description}</p>
          )}
        </div>
      )
    case 'paragraph':
      return (
        <div
          className={
            widget.variant === 'warning'
              ? 'border-l-4 border-l-warning bg-warning-tinted px-4 py-2 text-sm'
              : 'text-sm text-text'
          }
        >
          {widget.contenu.map((line, index) => (
            <p key={index} className="my-1">
              {line}
            </p>
          ))}
        </div>
      )
  }
}
