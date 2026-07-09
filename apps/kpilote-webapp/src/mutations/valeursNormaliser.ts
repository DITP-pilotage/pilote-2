import { useMutation } from '@tanstack/react-query'
import { type NormaliserValeursImportResponseApiModel } from '@pilote/kpilote-shared/valeurImport'

import { normaliserValeurs, type NormaliserError } from '@/api/valeursNormaliser'

export class NormaliserErrorException extends Error {
  constructor(readonly detail: NormaliserError) {
    super(detail.type)
    this.name = 'NormaliserErrorException'
  }
}

export function useNormaliserValeurs({ indicateurId }: { indicateurId: string }) {
  return useMutation<
    NormaliserValeursImportResponseApiModel,
    NormaliserErrorException,
    { rows: Array<Record<string, unknown>>; nomFichier?: string }
  >({
    mutationFn: async ({ rows, nomFichier }) => {
      const res = await normaliserValeurs({
        indicateurId,
        rows,
        ...(nomFichier ? { nomFichier } : {}),
      })
      if (res.isErr()) throw new NormaliserErrorException(res.error)
      return res.value
    },
  })
}
