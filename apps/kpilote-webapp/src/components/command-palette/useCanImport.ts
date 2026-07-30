import { useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'

import { canWriteDataIndicateur, mePermissionsQueryOptions } from '@/queries/mePermissions'

export function useCanImport(): (indicateurId: string) => boolean {
  const { data: permissions } = useSuspenseQuery(mePermissionsQueryOptions())
  return useMemo(
    () => (indicateurId: string) => canWriteDataIndicateur({ permissions, indicateurId }),
    [permissions],
  )
}
