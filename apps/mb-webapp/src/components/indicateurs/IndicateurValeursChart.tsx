import { useSuspenseQueries } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

import { buildMonthlySeries } from '@/components/indicateurs/MonthlySeries'
import { formatMonthYearShortFr, formatNumberFr } from '@/lib/format'
import {
  indicateurTauxProgressionQueryOptions,
  indicateurValeursQueryOptions,
} from '@/queries/indicateurs'

// 13 (et non 12) pour faire apparaître deux occurrences du même mois sur les indicateurs saisis une fois par an.
const DEFAULT_WINDOW = 13

const SERIES_VALEUR = 'Valeur'
const SERIES_OBJECTIF = 'Objectif'

type IndicateurValeursChartProps = {
  indicateurId: string
  individuId: string
}

type AxisTooltipParam = {
  seriesName?: string
  value?: unknown
  dataIndex?: number
  axisValueLabel?: string
  marker?: string
}

// Construit le HTML du tooltip ECharts au survol d'un point :
// - en-tête : libellé du mois (label de l'axe X) ;
// - une ligne par série affichée (Valeur, Objectif) avec son marqueur coloré ;
// - ligne supplémentaire pour le taux de progression résolu sur le bucket
//   courant, uniquement si un taux est applicable.
const renderTooltip = ({
  params,
  labels,
  tauxByIndex,
}: {
  params: ReadonlyArray<AxisTooltipParam>
  labels: ReadonlyArray<string>
  tauxByIndex: ReadonlyArray<number | null>
}): string => {
  const head = params[0]
  if (!head) return ''
  const dataIndex = head.dataIndex ?? 0
  const monthLabel = head.axisValueLabel ?? labels[dataIndex] ?? ''
  const lines = params.map((p) => {
    const marker = p.marker ?? ''
    const name = p.seriesName ?? ''
    const value = typeof p.value === 'number' ? formatNumberFr(p.value) : '—'
    return `${marker}${name} : <strong>${value}</strong>`
  })
  const taux = tauxByIndex[dataIndex]
  if (taux !== null && taux !== undefined) {
    lines.push(`Taux de progression : <strong>${Math.round(taux)} %</strong>`)
  }
  return `${monthLabel}<br/>${lines.join('<br/>')}`
}

export function IndicateurValeursChart({ indicateurId, individuId }: IndicateurValeursChartProps) {
  // useSuspenseQueries pour lancer les 2 requêtes en parallèle (pas de waterfall).
  const [{ data: valeurs }, { data: taux }] = useSuspenseQueries({
    queries: [
      indicateurValeursQueryOptions(indicateurId, individuId),
      indicateurTauxProgressionQueryOptions(indicateurId, individuId),
    ],
  })

  const series = useMemo(
    () =>
      buildMonthlySeries({
        valeurs: valeurs.items,
        tauxProgression: taux.items,
        windowSize: DEFAULT_WINDOW,
      }),
    [valeurs.items, taux.items],
  )

  const labels = series.months.map((month) => formatMonthYearShortFr(month.date))
  const showSlider = series.months.length > DEFAULT_WINDOW
  const hasObjectif = series.valeursCible.some((value) => value !== null)

  const option = {
    grid: { top: 32, right: 24, bottom: showSlider ? 60 : 32, left: 56 },
    legend: hasObjectif ? { top: 0 } : undefined,
    tooltip: {
      trigger: 'axis',
      formatter: (params: ReadonlyArray<AxisTooltipParam>) =>
        renderTooltip({ params, labels, tauxByIndex: series.tauxProgression }),
    },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatNumberFr(value),
      },
    },
    dataZoom: showSlider
      ? [
          {
            type: 'inside',
            startValue: series.defaultWindow.startIndex,
            endValue: series.defaultWindow.endIndex,
          },
          {
            type: 'slider',
            startValue: series.defaultWindow.startIndex,
            endValue: series.defaultWindow.endIndex,
            height: 20,
            bottom: 16,
          },
        ]
      : undefined,
    series: [
      {
        name: SERIES_VALEUR,
        type: 'line',
        smooth: false,
        showSymbol: true,
        connectNulls: true,
        data: series.values,
      },
      ...(hasObjectif
        ? [
            {
              name: SERIES_OBJECTIF,
              type: 'line',
              smooth: false,
              showSymbol: false,
              connectNulls: true,
              lineStyle: { type: 'dashed' },
              data: series.valeursCible,
            },
          ]
        : []),
    ],
  }

  return <ReactECharts option={option} style={{ height: 340 }} notMerge />
}
