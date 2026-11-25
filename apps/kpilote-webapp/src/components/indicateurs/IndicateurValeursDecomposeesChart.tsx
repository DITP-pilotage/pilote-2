import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQueries } from '@tanstack/react-query'
import { format } from 'echarts/core'
import ReactECharts from 'echarts-for-react'

import {
  type AxisTooltipParam,
  DEFAULT_WINDOW,
} from '@/components/indicateurs/IndicateurValeursChart'
import { buildMonthlyMultiSeries } from '@/components/indicateurs/MonthlySeries'
import { type Decomposition } from '@/lib/axes/decomposition'
import { formatMonthYearShortFr, formatNumberFr } from '@/lib/format'
import { indicateurValeursQueryOptions } from '@/queries/indicateurs'
import { Text } from '@pilote/kpilote-ui/Typography'

const ENSEMBLE_KEY = 'ensemble'

type IndicateurValeursDecomposeesChartProps = {
  indicateurId: string
  individuId: string
  unite: UniteIndicateurApiModel | null
  /** Sélection courante, tracée en repère quand `showEnsemble`. */
  modalites: ReadonlyArray<string>
  legend: string
  showEnsemble: boolean
  decomposition: Decomposition
  axeNom: string
}

// Avec plusieurs séries, un mois sans valeur est fréquent : on n'affiche que
// les séries qui en ont une.
export const renderDecomposedTooltip = ({
  params,
  labels,
  unite,
}: {
  params: ReadonlyArray<AxisTooltipParam>
  labels: ReadonlyArray<string>
  unite: UniteIndicateurApiModel | null
}): string => {
  const head = params[0]
  if (!head) return ''
  const monthLabel = head.axisValueLabel ?? labels[head.dataIndex ?? 0] ?? ''
  const lines = params.flatMap((param) =>
    typeof param.value === 'number'
      ? [
          `${param.marker ?? ''}${format.encodeHTML(param.seriesName ?? '')} : <strong>${formatNumberFr(param.value, unite)}</strong>`,
        ]
      : [],
  )
  return `${monthLabel}<br/>${lines.join('<br/>')}`
}

export function IndicateurValeursDecomposeesChart(props: IndicateurValeursDecomposeesChartProps) {
  if (props.decomposition.series.length === 0) {
    return (
      <Text tone="muted">
        Pas de modalité plus fine sur l'axe « {props.axeNom} » pour la sélection courante.
      </Text>
    )
  }
  return <DecomposedChart {...props} />
}

function DecomposedChart({
  indicateurId,
  individuId,
  unite,
  modalites,
  legend,
  showEnsemble,
  decomposition,
  axeNom,
}: IndicateurValeursDecomposeesChartProps) {
  // Une lecture par modalité, la même que celle du sélecteur : le cache est partagé.
  // L'ensemble est la lecture du graphique simple, déjà chargée par la fiche.
  const [ensemble, ...results] = useSuspenseQueries({
    queries: [
      indicateurValeursQueryOptions(indicateurId, individuId, modalites),
      ...decomposition.series.map((serie) =>
        indicateurValeursQueryOptions(indicateurId, individuId, serie.modalites),
      ),
    ],
  })

  const multi = buildMonthlyMultiSeries({
    series: [
      ...(showEnsemble
        ? [{ key: ENSEMBLE_KEY, name: legend, valeurs: ensemble?.data.items ?? [] }]
        : []),
      ...decomposition.series.map((serie, index) => ({
        key: serie.modalite.id,
        name: serie.modalite.nom,
        valeurs: results[index]?.data.items ?? [],
      })),
    ],
    windowSize: DEFAULT_WINDOW,
  })
  const modaliteSeries = multi.series.filter((serie) => serie.key !== ENSEMBLE_KEY)

  if (modaliteSeries.length === 0) {
    return (
      <Text tone="muted">
        Aucune valeur par modalité de l'axe « {axeNom} » pour la sélection courante.
      </Text>
    )
  }

  const labels = multi.months.map((month) => formatMonthYearShortFr(month.bucket))
  const showSlider = multi.months.length > DEFAULT_WINDOW

  const option = {
    grid: { top: 56, right: 24, bottom: showSlider ? 60 : 32, left: 56 },
    legend: { top: 0, type: 'scroll' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: ReadonlyArray<AxisTooltipParam>) =>
        renderDecomposedTooltip({ params, labels, unite }),
    },
    xAxis: { type: 'category', data: labels, boundaryGap: false },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value: number) => formatNumberFr(value, unite) },
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
      name: serie.name,
      type: 'line',
      smooth: false,
      showSymbol: true,
      connectNulls: true,
      data: serie.values,
      ...(serie.key === ENSEMBLE_KEY ? { lineStyle: { type: 'dashed', width: 3 } } : {}),
    })),
  }

  return (
    <div className="space-y-2">
      <ReactECharts option={option} style={{ height: 380 }} notMerge />
      {decomposition.total > decomposition.series.length ? (
        <Text variant="caption">
          {modaliteSeries.length} modalités affichées sur {decomposition.total}.
        </Text>
      ) : null}
    </div>
  )
}
