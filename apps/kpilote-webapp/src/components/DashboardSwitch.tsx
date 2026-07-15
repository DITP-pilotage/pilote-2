import { useLocation, useNavigate, useSearch } from '@tanstack/react-router'
import { FolderClosed, LineChart } from 'lucide-react'

import { SegmentedControl } from '@/components/ui/SegmentedControl'

const ROUTE_BY_VUE = {
  indicateurs: '/indicateurs',
  dossiers: '/paniers',
} as const

type VueTableauDeBord = keyof typeof ROUTE_BY_VUE

export function DashboardSwitch() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const { pathname } = useLocation()
  const vue: VueTableauDeBord = pathname.startsWith('/paniers') ? 'dossiers' : 'indicateurs'

  return (
    <SegmentedControl
      aria-label="Basculer entre indicateurs et dossiers"
      value={vue}
      onValueChange={(prochaineVue) => {
        void navigate({
          to: ROUTE_BY_VUE[prochaineVue],
          search: { individu: search.individu, referentiel: search.referentiel },
        })
      }}
      options={[
        {
          value: 'indicateurs',
          label: <span className="sr-only sm:not-sr-only">Indicateurs</span>,
          icon: <LineChart />,
        },
        {
          value: 'dossiers',
          label: <span className="sr-only sm:not-sr-only">Mes dossiers</span>,
          icon: <FolderClosed />,
        },
      ]}
    />
  )
}
