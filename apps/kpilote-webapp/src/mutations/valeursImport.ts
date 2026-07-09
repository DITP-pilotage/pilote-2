import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importValeursBatch } from '@/api/valeursImport'
import type { ParsedRow } from '@/components/import-valeurs/parseFichierValeurs'

export function useImportValeursBatch({ indicateurId }: { indicateurId: string }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (rows: ParsedRow[]) => importValeursBatch({ indicateurId, rows }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['indicateur', indicateurId] })
    },
  })
}
