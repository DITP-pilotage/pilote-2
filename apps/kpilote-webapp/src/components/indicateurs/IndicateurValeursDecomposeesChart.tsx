import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

import { buildMonthlyMultiSeries } from '@/components/indicateurs/MonthlySeries'
import { Text } from '@pilote/kpilote-ui/Typography'
import { type Decomposition } from '@/lib/individus/decomposition'
import { formatMonthYearShortFr, formatNumberAvecUniteFr } from '@/lib/format'
import { indicateurValeursCellulesQueryOptions } from '@/queries/indicateurs'

// Même fenêtre que le graphique simple (cf. IndicateurValeursChart).
const DEFAULT_WINDOW = 13

type AxisTooltipParam = {
  seriesName?: string
  value?: unknown
  dataIndex?: number
  axisValueLabel?: string
  marker?: string
}

type Props = {
  indicateurId: string
  decomposition: Decomposition
  dimensionNom: string
  unite: UniteIndicateurApiModel | null
}

// Graphique d'un indicateur multi-dimension décomposé selon une dimension : une
// série par membre (cellule courante dont la coordonnée de cette dimension est
// remplacée), toutes les cellules en une seule requête.
export function IndicateurValeursDecomposeesChart(props: Props) {
  // Pas de requête sans cellule (l'API exige au moins un identifiant).
  if (props.decomposition.series.length === 0) {
    return (
      <Text variant="body" tone="muted">
        Aucun sous-niveau « {props.dimensionNom} » à afficher pour la sélection courante.
      </Text>
    )
  }
  return <ChartDecompose {...props} />
}

function ChartDecompose({ indicateurId, decomposition, unite }: Props) {
  const cellules = decomposition.series.map((serie) => serie.cellule)
  const { data: valeurs } = useSuspenseQuery(
    indicateurValeursCellulesQueryOptions(indicateurId, cellules),
  )

  const multi = useMemo(
    () =>
      buildMonthlyMultiSeries({
        series: decomposition.series.map((serie) => ({
          key: serie.cellule,
          valeurs: valeurs.items.filter((item) => item.individu === serie.cellule),
        })),
        windowSize: DEFAULT_WINDOW,
      }),
    [decomposition.series, valeurs.items],
  )

  const labels = multi.months.map((month) => formatMonthYearShortFr(month.bucket))
  const showSlider = multi.months.length > DEFAULT_WINDOW
  const nomParCellule = new Map(decomposition.series.map((s) => [s.cellule, s.nom]))

  const option = {
    grid: { top: 56, right: 24, bottom: showSlider ? 60 : 32, left: 56 },
    legend: { top: 0, type: 'scroll' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: ReadonlyArray<AxisTooltipParam>) => {
        const head = params[0]
        if (!head) return ''
        const monthLabel = head.axisValueLabel ?? labels[head.dataIndex ?? 0] ?? ''
        const lines = params.map((p) => {
          const value = typeof p.value === 'number' ? formatNumberAvecUniteFr(p.value, unite) : '—'
          return `${p.marker ?? ''}${p.seriesName ?? ''} : <strong>${value}</strong>`
        })
        return `${monthLabel}<br/>${lines.join('<br/>')}`
      },
    },
    xAxis: { type: 'category', data: labels, boundaryGap: false },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value: number) => formatNumberAvecUniteFr(value, unite) },
    },
    dataZoom: showSlider
      ? [
          {
            type: 'inside',
            startValue: multi.defaultWindow.startIndex,
            endValue: multi.defaultWindow.endIndex,
          },
          {
            type: 'slider',
            startValue: multi.defaultWindow.startIndex,
            endValue: multi.defaultWindow.endIndex,
            height: 20,
            bottom: 16,
          },
        ]
      : undefined,
    series: multi.series.map((serie) => ({
      name: nomParCellule.get(serie.key) ?? serie.key,
      type: 'line',
      smooth: false,
      showSymbol: true,
      connectNulls: true,
      data: serie.values,
    })),
  }

  return (
    <div className="space-y-2">
      <ReactECharts option={option} style={{ height: 380 }} notMerge />
      {decomposition.total > decomposition.series.length ? (
        <Text variant="body" tone="subtle" className="text-xs">
          {decomposition.series.length} premiers membres affichés sur {decomposition.total}.
        </Text>
      ) : null}
    </div>
  )
}
