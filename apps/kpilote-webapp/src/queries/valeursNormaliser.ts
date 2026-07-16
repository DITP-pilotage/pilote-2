import { queryOptions, skipToken } from '@tanstack/react-query'

import { normaliserValeurs } from '@/api/valeursNormaliser'
import { lireLignesBrutes } from '@/components/import-valeurs/lireLignesBrutes'

// Extraction assistée par Albert d'un fichier hors format standard.
// `file` nul → query désactivée (skipToken) : le parent peut appeler ces
// options inconditionnellement et n'active la normalisation que quand un
// fichier hors format est détecté.
// La queryFn renvoie le Result tel quel (pas de throw) : un échec Albert
// (fichier non structurable, injoignable) est un état métier attendu — on
// retombe sur le message de format standard, sans retry ni error boundary.
export const normaliserValeursQueryOptions = ({
  indicateurId,
  file,
}: {
  indicateurId: string
  file: File | null
}) =>
  queryOptions({
    queryKey: ['normaliser-valeurs', indicateurId, file?.name, file?.size, file?.lastModified],
    queryFn: file
      ? async () => {
          const rows = await lireLignesBrutes({ file })
          return normaliserValeurs({ indicateurId, rows, nomFichier: file.name })
        }
      : skipToken,
    retry: false,
    staleTime: Infinity,
  })
