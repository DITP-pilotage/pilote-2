import { useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'

import { canWriteIndicateur, mePermissionsQueryOptions } from '@/queries/mePermissions'

export function useCanImport(): (indicateurId: string) => boolean {
  const { data: permissions } = useSuspenseQuery(mePermissionsQueryOptions())
  return useMemo(
    () => (indicateurId: string) => canWriteIndicateur({ permissions, indicateurId }),
    [permissions],
  )
}
