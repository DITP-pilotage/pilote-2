import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useRef } from 'react'

import { type FranceGeoJson } from '@/api/geoJson'
import { formatNumberFr } from '@/lib/format'

export type CartePoint = {
  joinValue: string
  valeur: number
  nom: string
}

export function CarteFrance({
  mapName,
  geoJson,
  points,
  onSelect,
}: {
  mapName: string
  geoJson: FranceGeoJson
  points: ReadonlyArray<CartePoint>
  onSelect?: (joinValue: string) => void
}) {
  const registeredRef = useRef<string | null>(null)

  useEffect(() => {
    if (registeredRef.current === mapName) return
    echarts.registerMap(mapName, geoJson as unknown as Parameters<typeof echarts.registerMap>[1])
    registeredRef.current = mapName
  }, [mapName, geoJson])

  const option = useMemo(() => {
    const data = points.map((p) => ({ name: p.joinValue, value: p.valeur, nomLisible: p.nom }))
    const values = points.map((p) => p.valeur)
    const min = values.length > 0 ? Math.min(...values) : 0
    const max = values.length > 0 ? Math.max(...values) : 1

    return {
      tooltip: {
        trigger: 'item' as const,
        formatter: (params: { name: string; value: unknown; data?: { nomLisible?: string } }) => {
          const label = params.data?.nomLisible ?? params.name
          if (typeof params.value !== 'number' || Number.isNaN(params.value)) {
            return `${label} — aucune valeur`
          }
          return `${label}<br/>${formatNumberFr(params.value)}`
        },
      },
      visualMap: {
        min,
        max: max === min ? min + 1 : max,
        orient: 'horizontal' as const,
        left: 'center',
        bottom: 8,
        showLabel: false,
        text: [formatNumberFr(max), formatNumberFr(min)],
        textGap: 8,
        inRange: {
          color: ['#e0e7ff', '#3730a3'],
        },
      },
      series: [
        {
          type: 'map' as const,
          map: mapName,
          nameProperty: 'code',
          roam: false,
          label: { show: false },
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: '#fbbf24' },
          },
          data,
        },
      ],
    }
  }, [mapName, points])

  const onEvents = useMemo(
    () => ({
      click: (params: { name?: unknown }) => {
        if (!onSelect) return
        if (typeof params.name !== 'string') return
        onSelect(params.name)
      },
    }),
    [onSelect],
  )

  return (
    <ReactECharts
      option={option}
      style={{ height: 560, cursor: onSelect ? 'pointer' : 'default' }}
      onEvents={onEvents}
      notMerge
    />
  )
}
