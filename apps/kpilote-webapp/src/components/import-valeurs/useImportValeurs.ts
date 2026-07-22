import { useQuery } from '@tanstack/react-query'

import { normaliserValeursQueryOptions } from '@/queries/valeursNormaliser'
import { fichierVersMatrice } from './lecture/fichierVersMatrice'
import { matriceVersRows, type ParsedRow, type ParseResult } from './lecture/matriceVersRows'
import { matriceVersRecords } from './lecture/matriceVersRecords'
import { deriverEtatImport, payloadDepuisEtat, type EtatImport } from './deriverEtatImport'

const cleDeFichier = (file: File): string => `${file.name}:${file.size}:${file.lastModified}`

// Orchestration de l'import : lit le fichier une seule fois en matrice, en dérive
// les deux projections (rows strictes / records bruts pour Albert), et expose un
// état discriminé + le payload prêt à envoyer. Toute la logique de transition vit
// dans `deriverEtatImport` (pur, testé) ; ce hook n'est que le câblage des queries.
export function useImportValeurs({
  file,
  indicateurId,
}: {
  file: File | null
  indicateurId: string
}): { etat: EtatImport; payload: ParsedRow[] | null } {
  const matriceQuery = useQuery({
    queryKey: ['import-matrice', file?.name, file?.size, file?.lastModified],
    queryFn: () => {
      // `enabled: file != null` garantit file défini quand queryFn s'exécute.
      if (!file) throw new Error('file attendu')
      return fichierVersMatrice({ file })
    },
    enabled: file != null,
  })

  const lecture = matriceQuery.data
  const parseResult: ParseResult | undefined = !lecture
    ? undefined
    : lecture.ok
      ? matriceVersRows({ matrice: lecture.matrice })
      : { ok: false, error: { code: 'UNREADABLE' } }

  // Records dérivés seulement pour un fichier hors format standard (colonnes
  // manquantes) → c'est le seul cas qui déclenche Albert.
  const horsFormat =
    parseResult !== undefined && !parseResult.ok && parseResult.error.code === 'MISSING_COLUMNS'
  const records =
    horsFormat && lecture?.ok ? matriceVersRecords({ matrice: lecture.matrice }) : null

  const albertQuery = useQuery(
    normaliserValeursQueryOptions({
      indicateurId,
      records,
      nomFichier: records ? (file?.name ?? null) : null,
      cleFichier: records && file ? cleDeFichier(file) : null,
    }),
  )

  const albert = {
    revue: albertQuery.data?.isOk() ? albertQuery.data.value : null,
    echec: albertQuery.data?.isErr() === true || albertQuery.isError,
  }

  const etat = deriverEtatImport({
    file,
    lectureEnCours: file != null && matriceQuery.isPending,
    parseResult,
    albert,
  })

  return { etat, payload: payloadDepuisEtat(etat) }
}
