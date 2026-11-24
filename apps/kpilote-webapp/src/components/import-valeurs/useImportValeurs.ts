import { type CiblesSaisie } from '@pilote/kpilote-shared/valeurImport'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import { ciblesSaisieQueryOptions } from '@/queries/ciblesSaisie'
import { planImportEtapesQueryOptions, planImportQueryOptions } from '@/queries/planImport'

import { deriveEtatImport, type EtatImport, selectTableauForLlm } from './deriveEtatImport'
import { readTableau } from './lecture/readTableau'

const fileKeyOf = (file: File): string => `${file.name}:${file.size}:${file.lastModified}`

// Câblage des requêtes de l'import : lecture du fichier, cibles de saisie de
// l'indicateur et, pour un fichier hors format standard, plan construit par
// Albert. Toute la dérivation vit dans `deriveEtatImport` (pur, testé).
export function useImportValeurs({
  file,
  indicateurId,
}: {
  file: File | null
  indicateurId: string
}): { etat: EtatImport; cibles: CiblesSaisie | undefined; fileKey: string | null } {
  const queryClient = useQueryClient()
  const fileKey = file ? fileKeyOf(file) : null

  const ciblesQuery = useQuery(ciblesSaisieQueryOptions(indicateurId))
  const lectureQuery = useQuery({
    queryKey: ['import-tableau', fileKey],
    queryFn: () => {
      // `enabled` garantit un fichier quand la queryFn s'exécute.
      if (!file) throw new Error('file attendu')
      return readTableau({ file })
    },
    enabled: file !== null,
    staleTime: Infinity,
  })

  const tableauForLlm = selectTableauForLlm({
    lecture: lectureQuery.data,
    cibles: ciblesQuery.data,
  })
  const planImportQuery = useQuery(
    planImportQueryOptions({
      queryClient,
      indicateurId,
      fileKey,
      tableau: tableauForLlm,
      nomFichier: file?.name ?? null,
    }),
  )
  const etapesQuery = useQuery(planImportEtapesQueryOptions({ indicateurId, fileKey }))

  // Mémoïsé : la grille rejoue le plan sur le tableau à chaque nouvel état, pas à chaque rendu.
  const hasFile = file !== null
  const etat = useMemo(
    () =>
      deriveEtatImport({
        hasFile,
        lecture: lectureQuery.data,
        cibles: ciblesQuery.data,
        isCiblesError: ciblesQuery.isError,
        planImport: planImportQuery.data,
        etapes: etapesQuery.data,
      }),
    [
      hasFile,
      lectureQuery.data,
      ciblesQuery.data,
      ciblesQuery.isError,
      planImportQuery.data,
      etapesQuery.data,
    ],
  )

  return { etat, cibles: ciblesQuery.data, fileKey }
}
