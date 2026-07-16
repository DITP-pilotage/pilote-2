import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { NormaliserValeursImportResponseApiModel } from '@pilote/kpilote-shared/valeurImport'

import { normaliserValeursQueryOptions } from '@/queries/valeursNormaliser'

// Rendu uniquement quand le parse standard échoue sur MISSING_COLUMNS : tente
// une extraction assistée par Albert. En succès, on remonte la revue au parent
// (qui bascule sur l'écran de normalisation) ; en échec, on retombe sur le
// message de format standard.
export function AlbertFallback({
  file,
  indicateurId,
  onResolved,
  messageSiEchec,
}: {
  file: File
  indicateurId: string
  onResolved: (revue: NormaliserValeursImportResponseApiModel) => void
  messageSiEchec: string
}) {
  const query = useQuery(normaliserValeursQueryOptions({ indicateurId, file }))

  useEffect(() => {
    if (query.data?.isOk()) onResolved(query.data.value)
  }, [query.data, onResolved])

  if (query.isPending) {
    return (
      <p className="mt-3 rounded-lg border border-border bg-background/60 px-4 py-3 text-sm text-text-muted">
        Format non standard détecté — extraction assistée en cours…
      </p>
    )
  }

  // Échec Albert (ou query en erreur) : on affiche le message de format standard.
  if (!query.data || query.data.isErr()) {
    return (
      <p className="mt-3 rounded-lg border border-accent-rouge/30 bg-accent-rouge/5 px-4 py-3 text-sm text-accent-rouge">
        {messageSiEchec}
      </p>
    )
  }

  // Succès : le parent bascule sur la revue via onResolved, rien à afficher ici.
  return null
}
