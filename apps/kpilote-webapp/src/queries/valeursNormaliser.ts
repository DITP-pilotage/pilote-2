import { queryOptions, skipToken } from '@tanstack/react-query'

import { normaliserValeurs } from '@/api/valeursNormaliser'

// Extraction assistée par Albert d'un fichier hors format standard.
// `records` nul → query désactivée (skipToken) : l'appelant peut invoquer ces
// options inconditionnellement et n'active la normalisation que quand un fichier
// hors format est détecté. Les `records` sont projetés une fois depuis la matrice
// déjà lue (pas de relecture du fichier ici).
// La queryFn renvoie le Result tel quel (pas de throw) : un échec Albert (fichier
// non structurable, injoignable) est un état métier attendu — on retombe sur le
// message de format standard, sans retry ni error boundary.
export const normaliserValeursQueryOptions = ({
  indicateurId,
  records,
  nomFichier,
  cleFichier,
}: {
  indicateurId: string
  records: Array<Record<string, unknown>> | null
  nomFichier: string | null
  cleFichier: string | null
}) =>
  queryOptions({
    queryKey: ['normaliser-valeurs', indicateurId, cleFichier],
    queryFn:
      records && nomFichier
        ? async () => normaliserValeurs({ indicateurId, rows: records, nomFichier })
        : skipToken,
    retry: false,
    staleTime: Infinity,
  })
