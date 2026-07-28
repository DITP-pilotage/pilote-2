import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useEffect, useMemo, useRef } from 'react'

import { type FranceGeoJson } from '@/assets/maps/geoJson'
import { formatNumberFr } from '@/lib/format'

export type CartePoint = {
  joinValue: string
  valeur: number
  nom: string
}

// Cadrage partagé entre le choroplèthe et l'overlay des frontières pour qu'ils
// se superposent exactement.
const LAYOUT = {
  aspectScale: 1,
  layoutCenter: ['50%', '50%'] as [string, string],
  layoutSize: '90%',
}

export function CarteFrance({
  mapName,
  geoJson,
  frontieres,
  points,
  onSelect,
}: {
  mapName: string
  geoJson: FranceGeoJson
  frontieres: FranceGeoJson
  points: ReadonlyArray<CartePoint>
  onSelect?: (joinValue: string) => void
}) {
  const registeredRef = useRef<string | null>(null)
  const frontieresMapName = `${mapName}__frontieres`

  useEffect(() => {
    if (registeredRef.current === mapName) return
    echarts.registerMap(mapName, geoJson)
    registeredRef.current = mapName
  }, [mapName, geoJson])

  useEffect(() => {
    echarts.registerMap(frontieresMapName, frontieres)
  }, [frontieresMapName, frontieres])

  const option = useMemo(() => {
    const data = points.map((p) => ({ name: p.joinValue, value: p.valeur, nomLisible: p.nom }))
    const values = points.map((p) => p.valeur)
    const min = values.length > 0 ? Math.min(...values) : 0
    const max = values.length > 0 ? Math.max(...values) : 1

    const frontieresSeries = {
      type: 'map' as const,
      map: frontieresMapName,
      ...LAYOUT,
      roam: false,
      silent: true,
      label: { show: false },
      emphasis: { disabled: true },
      tooltip: { show: false },
      itemStyle: {
        areaColor: 'transparent',
        // Frontières entre régions : trait épais uniforme par-dessus le choroplèthe.
        borderColor: '#ffffff',
        borderWidth: 2.4,
      },
    }

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
        // Seul le choroplèthe (série 0) est coloré par la valeur.
        seriesIndex: 0,
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
          ...LAYOUT,
          itemStyle: {
            // Liseré fin distinguant les départements au sein d'une même région.
            borderColor: '#ffffff',
            borderWidth: 0.5,
          },
          label: { show: false },
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: '#fbbf24' },
          },
          data,
        },
        frontieresSeries,
      ],
    }
  }, [mapName, frontieresMapName, points])

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
