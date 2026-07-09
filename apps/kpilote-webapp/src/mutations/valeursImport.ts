import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importValeursBatch, ImportError } from '@/api/valeursImport'
import type { ParsedRow } from '@/components/import-valeurs/parseFichierValeurs'

export function useImportValeursBatch({ indicateurId }: { indicateurId: string }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      const res = await importValeursBatch({ indicateurId, rows })
      if (res.isErr()) throw new ImportError(res.error)
      return res.value
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['indicateur', indicateurId] })
    },
  })
}
