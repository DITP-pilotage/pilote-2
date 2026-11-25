import { type UniteIndicateurApiModel } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQueries } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'

import { renderTooltip } from '@/components/indicateurs/IndicateurValeursChart'
import { buildMonthlyMultiSeries } from '@/components/indicateurs/MonthlySeries'
import { type Decomposition } from '@/lib/axes/decomposition'
import { formatMonthYearShortFr, formatNumberFr } from '@/lib/format'
import { indicateurValeursQueryOptions } from '@/queries/indicateurs'
import { Text } from '@pilote/kpilote-ui/Typography'

// Même fenêtre que le graphique simple (cf. IndicateurValeursChart).
const DEFAULT_WINDOW = 13

type IndicateurValeursDecomposeesChartProps = {
  indicateurId: string
  individuId: string
  unite: UniteIndicateurApiModel | null
  decomposition: Decomposition
  axeNom: string
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
  decomposition,
  axeNom,
}: IndicateurValeursDecomposeesChartProps) {
  // Une lecture par modalité, la même que celle du sélecteur : le cache est partagé.
  const results = useSuspenseQueries({
    queries: decomposition.series.map((serie) =>
      indicateurValeursQueryOptions(indicateurId, individuId, serie.modalites),
    ),
  })

  const multi = buildMonthlyMultiSeries({
    series: decomposition.series.map((serie, index) => ({
      key: serie.modalite.id,
      valeurs: results[index]?.data.items ?? [],
    })),
    windowSize: DEFAULT_WINDOW,
  })
  const nomByModalite = new Map(
    decomposition.series.map((serie) => [serie.modalite.id, serie.modalite.nom]),
  )

  if (multi.series.length === 0) {
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
      formatter: (params: Parameters<typeof renderTooltip>[0]['params']) =>
        renderTooltip({ params, labels, valeursByIndex: [], tauxByIndex: [], unite }),
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
      name: nomByModalite.get(serie.key) ?? serie.key,
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
        <Text variant="caption">
          {decomposition.series.length} premières modalités affichées sur {decomposition.total}.
        </Text>
      ) : null}
    </div>
  )
}
