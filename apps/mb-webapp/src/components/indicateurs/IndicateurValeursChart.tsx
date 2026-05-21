import { useSuspenseQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

import { buildMonthlySeries } from '@/components/indicateurs/MonthlySeries'
import { formatMonthYearShortFr, formatNumberFr } from '@/lib/format'
import { indicateurValeursQueryOptions } from '@/queries/indicateurs'

// 13 (et non 12) pour faire apparaître deux occurrences du même mois sur les indicateurs saisis une fois par an.
const DEFAULT_WINDOW = 13

type IndicateurValeursChartProps = {
  indicateurId: string
  individuId: string
}

export function IndicateurValeursChart({ indicateurId, individuId }: IndicateurValeursChartProps) {
  const { data } = useSuspenseQuery(indicateurValeursQueryOptions(indicateurId, individuId))

  const series = useMemo(
    () => buildMonthlySeries({ valeurs: data.items, windowSize: DEFAULT_WINDOW }),
    [data.items],
  )

  const labels = series.months.map((month) => formatMonthYearShortFr(month.date))
  const showSlider = series.months.length > DEFAULT_WINDOW

  const option = {
    grid: { top: 32, right: 24, bottom: showSlider ? 60 : 32, left: 56 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: unknown) => (typeof value === 'number' ? formatNumberFr(value) : '—'),
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
        type: 'line',
        smooth: false,
        showSymbol: true,
        connectNulls: true,
        data: series.values,
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 340 }} notMerge />
}
