import { queryOptions } from '@tanstack/react-query'
import { type Result } from 'neverthrow'
import { type NormaliserValeursImportResponseApiModel } from '@pilote/kpilote-shared/valeurImport'

import { normaliserValeurs, type NormaliserError } from '@/api/valeursNormaliser'
import { lireLignesBrutes } from '@/components/import-valeurs/lireLignesBrutes'

// Extraction assistée par Albert d'un fichier hors format standard.
// La queryFn renvoie le Result tel quel (pas de throw) : un échec Albert
// (fichier non structurable, injoignable) est un état métier attendu — on
// retombe sur le message de format standard, sans retry ni error boundary.
export const normaliserValeursQueryOptions = ({
  indicateurId,
  file,
}: {
  indicateurId: string
  file: File
}) =>
  queryOptions({
    queryKey: ['normaliser-valeurs', indicateurId, file.name, file.size, file.lastModified],
    queryFn: async (): Promise<
      Result<NormaliserValeursImportResponseApiModel, NormaliserError>
    > => {
      const rows = await lireLignesBrutes({ file })
      return normaliserValeurs({ indicateurId, rows, nomFichier: file.name })
    },
    retry: false,
    staleTime: Infinity,
  })
