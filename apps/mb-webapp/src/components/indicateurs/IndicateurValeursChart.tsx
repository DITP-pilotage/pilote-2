import { useSuspenseQuery } from '@tanstack/react-query'
import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

import { indicateurValeursQueryOptions } from '@/queries/indicateurs'

type IndicateurValeursChartProps = {
  indicateurId: string
  individuId: string
}

const monthLabelFormatter = new Intl.DateTimeFormat('fr-FR', {
  month: 'short',
  year: '2-digit',
})
const valueFormatter = new Intl.NumberFormat('fr-FR')

// 13 (et non 12) pour faire apparaître deux occurrences du même mois sur les indicateurs saisis une fois par an.
const DEFAULT_WINDOW = 13

type Item = { date: string; valeur: number }
type MonthRef = { year: number; month: number }

function latestValuePerMonth(items: ReadonlyArray<Item>): Map<string, number> {
  const lastDateByMonth = new Map<string, string>()
  const valueByMonth = new Map<string, number>()
  for (const item of items) {
    const ym = item.date.slice(0, 7)
    const lastDate = lastDateByMonth.get(ym)
    if (!lastDate || item.date > lastDate) {
      lastDateByMonth.set(ym, item.date)
      valueByMonth.set(ym, item.valeur)
    }
  }
  return valueByMonth
}

function monthRefFromDate(date: Date): MonthRef {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}

function range(items: ReadonlyArray<Item>): { start: MonthRef; end: MonthRef } {
  let earliest: string | undefined
  let latest: string | undefined
  for (const item of items) {
    if (!earliest || item.date < earliest) earliest = item.date
    if (!latest || item.date > latest) latest = item.date
  }
  const end = monthRefFromDate(latest ? new Date(latest) : new Date())
  const endIndex = end.year * 12 + end.month
  const earliestRef = earliest ? monthRefFromDate(new Date(earliest)) : end
  const earliestIndex = earliestRef.year * 12 + earliestRef.month
  const minStartIndex = endIndex - (DEFAULT_WINDOW - 1)
  const startIndex = Math.min(earliestIndex, minStartIndex)
  const start = { year: Math.floor(startIndex / 12), month: ((startIndex % 12) + 12) % 12 }
  return { start, end }
}

function monthsBetween(start: MonthRef, end: MonthRef) {
  const startIndex = start.year * 12 + start.month
  const endIndex = end.year * 12 + end.month
  const months: { ym: string; date: Date }[] = []
  for (let i = startIndex; i <= endIndex; i++) {
    const year = Math.floor(i / 12)
    const month = ((i % 12) + 12) % 12
    const date = new Date(Date.UTC(year, month, 1))
    const ym = `${year}-${String(month + 1).padStart(2, '0')}`
    months.push({ ym, date })
  }
  return months
}

export function IndicateurValeursChart({ indicateurId, individuId }: IndicateurValeursChartProps) {
  const { data } = useSuspenseQuery(indicateurValeursQueryOptions(indicateurId, individuId))

  const { labels, values, startIndex, endIndex } = useMemo(() => {
    const valueByMonth = latestValuePerMonth(data.items)
    const { start, end } = range(data.items)
    const months = monthsBetween(start, end)
    const last = months.length - 1
    return {
      labels: months.map((m) => monthLabelFormatter.format(m.date)),
      values: months.map((m) => valueByMonth.get(m.ym) ?? null),
      startIndex: Math.max(0, last - (DEFAULT_WINDOW - 1)),
      endIndex: last,
    }
  }, [data.items])

  const showSlider = labels.length > DEFAULT_WINDOW

  const option = {
    grid: { top: 32, right: 24, bottom: showSlider ? 60 : 32, left: 56 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (val: unknown) =>
        typeof val === 'number' ? valueFormatter.format(val) : '—',
    },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (val: number) => valueFormatter.format(val),
      },
    },
    dataZoom: showSlider
      ? [
          { type: 'inside', startValue: startIndex, endValue: endIndex },
          { type: 'slider', startValue: startIndex, endValue: endIndex, height: 20, bottom: 16 },
        ]
      : undefined,
    series: [
      {
        type: 'line',
        smooth: false,
        showSymbol: true,
        connectNulls: true,
        data: values,
      },
    ],
  }

  return <ReactECharts option={option} style={{ height: 340 }} notMerge />
}
