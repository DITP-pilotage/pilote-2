import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { analytics } from '@/analytics/tracker'
import { importValeursBatch, ImportError } from '@/api/valeursImport'
import type { ParsedRow } from '@/components/import-valeurs/lecture/matriceVersRows'

export function useImportValeursBatch({ indicateurId }: { indicateurId: string }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      const res = await importValeursBatch({ indicateurId, rows })
      if (res.isErr()) throw new ImportError(res.error)
      return res.value
    },
    // Tracé ici et non via `meta` : les compteurs viennent du résultat de la
    // mutation, que le MutationCache ne sait pas typer. Le `meta` reste réservé
    // aux événements dont le contexte est connu à la déclaration.
    onSuccess: (result) => {
      analytics.trackEvent(
        analyticsEvents.import.valeursSuccess({
          entity_id: indicateurId,
          created_count: result.created,
          updated_count: result.updated,
        }),
      )
      void queryClient.invalidateQueries({ queryKey: ['indicateur', indicateurId] })
    },
  })
}
