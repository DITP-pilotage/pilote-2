import { MAX_VALEURS_PAR_BATCH } from '@pilote/kpilote-shared/valeurAvancement'
import {
  applyPlan,
  isImportable,
  type LigneImport,
  toItemsImport,
} from '@pilote/kpilote-shared/valeurImport/applyPlan'
import { listColonnesStandard } from '@pilote/kpilote-shared/valeurImport/buildPlan'
import { Button } from '@pilote/kpilote-ui/Button'
import { Modale } from '@pilote/kpilote-ui/Modale'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { Loader2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ImportError } from '@/api/valeursImport'
import { useImportValeursBatch } from '@/mutations/valeursImport'

import { applyCorrection, type CorrectionSaisie, type Edition, selectEdition } from './edition'
import { ImportAttente } from './ImportAttente'
import { ImportDropZone } from './ImportDropZone'
import { ImportGrille } from './ImportGrille'
import { ImportMessage } from './ImportMessage'
import { type LectureError } from './lecture/matriceVersTableau'
import { pluralize } from './pluralize'
import { traduireErreursBatch, traduireIssuesValidation } from './traduireErreursBatch'
import type { ImportTarget } from './useImportModal'
import { useImportValeurs } from './useImportValeurs'

const describeLectureError = (error: LectureError): string => {
  switch (error.code) {
    case 'EMPTY':
      return 'Le fichier ne contient aucune ligne de données.'
    case 'TOO_MANY_ROWS':
      return `Le fichier compte ${error.count} lignes. La limite est de ${error.max} lignes par import : scindez le fichier.`
    case 'TOO_MANY_COLUMNS':
      return `Le fichier compte ${error.count} colonnes. La limite est de ${error.max} colonnes.`
    case 'UNREADABLE':
      return 'Le fichier est illisible. Vérifiez qu’il s’agit d’un CSV ou d’un Excel valide.'
  }
}

export function ImportValeursModal({
  target,
  onClose,
}: {
  target: ImportTarget
  onClose: () => void
}) {
  const toast = useToast()
  const indicateurId = target.indicateur.id
  const mutation = useImportValeursBatch({ indicateurId })
  const [file, setFile] = useState<File | null>(target.initialFile ?? null)
  const [savedEdition, setSavedEdition] = useState<Edition | null>(null)
  const [erreursServeur, setErreursServeur] = useState<string[]>([])

  const { etat, cibles, fileKey } = useImportValeurs({ file, indicateurId })

  const grille = etat.kind === 'grille' ? etat : null
  // Mémoïsée : sans correction, `selectEdition` crée une nouvelle édition, et `applyPlan` se
  // rejouerait à chaque rendu.
  const edition = useMemo(
    () =>
      grille
        ? selectEdition({
            edition: savedEdition,
            key: `${fileKey}:${grille.origine}`,
            plan: grille.plan,
          })
        : null,
    [grille, savedEdition, fileKey],
  )
  const resultat = useMemo(() => {
    if (!grille || !edition) return null
    return applyPlan({
      plan: edition.plan,
      tableau: grille.tableau,
      corrections: edition.corrections,
    })
  }, [grille, edition])
  const items = useMemo(() => (resultat ? toItemsImport(resultat.lignes) : []), [resultat])

  const onFile = (newFile: File) => {
    setFile(newFile)
    setErreursServeur([])
  }

  const onCorrection = ({
    ligne,
    correction,
  }: {
    ligne: LigneImport
    correction: CorrectionSaisie
  }) => {
    if (!edition) return
    setSavedEdition(applyCorrection({ edition, ligne, correction }))
    setErreursServeur([])
  }

  const showGenericError = () => {
    toast({
      title: 'Import impossible.',
      description: 'Une erreur est survenue.',
      variant: 'error',
    })
  }

  const onSubmit = async () => {
    if (!resultat || items.length === 0) return
    setErreursServeur([])
    try {
      const result = await mutation.mutateAsync(items)
      toast({
        title: 'Import réussi.',
        description: `${result.created} créée(s) · ${result.updated} mise(s) à jour`,
      })
      target.onSuccess?.()
      onClose()
    } catch (error) {
      if (!(error instanceof ImportError)) return showGenericError()
      const { detail } = error
      if (detail.type === 'BATCH_INVALID') {
        // Les items envoyés sont les lignes importables, dans l'ordre de la grille.
        const rowNumbers = resultat.lignes.flatMap((ligne, index) =>
          isImportable(ligne) ? [index + 1] : [],
        )
        return setErreursServeur(
          traduireErreursBatch({ details: detail.details, axes: cibles?.axes ?? [], rowNumbers }),
        )
      }
      if (detail.type === 'VALIDATION_ERROR') {
        return setErreursServeur(traduireIssuesValidation({ issues: detail.issues }))
      }
      return showGenericError()
    }
  }

  const colonnes = cibles ? listColonnesStandard({ cibles }) : ['individu', 'date', 'valeur']
  const isTooLarge = items.length > MAX_VALEURS_PAR_BATCH
  const aCorriger = resultat ? resultat.lignes.length - items.length : 0
  const showAlbertLegend = grille?.origine === 'ALBERT'

  const body = () => {
    switch (etat.kind) {
      case 'vide':
        return <ImportDropZone onFile={onFile} colonnes={colonnes} />
      case 'lecture':
        return (
          <ImportMessage>
            <span className="flex items-center gap-2">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Lecture du fichier en cours…
            </span>
          </ImportMessage>
        )
      case 'illisible':
        return (
          <>
            <ImportDropZone onFile={onFile} colonnes={colonnes} />
            <ImportMessage variant="erreur">{describeLectureError(etat.error)}</ImportMessage>
          </>
        )
      case 'echec':
        return (
          <>
            <ImportDropZone onFile={onFile} colonnes={colonnes} />
            <ImportMessage variant="erreur">{etat.explication}</ImportMessage>
          </>
        )
      case 'attente':
        return (
          <ImportAttente
            nomFichier={file?.name ?? ''}
            nombreLignes={etat.tableau.lignes.length}
            nombreColonnes={etat.tableau.entetes.length}
            etapes={etat.etapes}
          />
        )
      case 'grille':
        if (!resultat || !cibles) return null
        return (
          <ImportGrille
            lignes={resultat.lignes}
            lignesEcartees={resultat.lignesEcartees}
            plan={etat.plan}
            cibles={cibles}
            origine={etat.origine}
            erreursServeur={erreursServeur}
            onCorrection={onCorrection}
          />
        )
    }
  }

  const submitLabel =
    items.length > 0
      ? `Importer ${items.length} ${pluralize({ count: items.length, singular: 'valeur', plural: 'valeurs' })}`
      : 'Importer'

  const footer = (
    <>
      {grille ? (
        <div className="mr-auto flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-text">
          {showAlbertLegend ? (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles aria-hidden className="size-3.5 text-blue-cumulus" />
              Rapproché par l’assistant IA
            </span>
          ) : null}
          {aCorriger > 0 ? <span>Les lignes à corriger ne seront pas importées.</span> : null}
          {isTooLarge ? (
            <span className="text-red-marianne">
              Un import est limité à {MAX_VALEURS_PAR_BATCH} valeurs : scindez le fichier.
            </span>
          ) : null}
        </div>
      ) : null}
      <Button variant="secondary" type="button" onClick={onClose} disabled={mutation.isPending}>
        Annuler
      </Button>
      <Button
        variant="primary"
        type="button"
        onClick={() => void onSubmit()}
        disabled={items.length === 0 || isTooLarge || mutation.isPending}
      >
        {mutation.isPending ? 'Import en cours…' : submitLabel}
      </Button>
    </>
  )

  const description = grille
    ? `${target.indicateur.nom} · ${file?.name ?? ''}`
    : `${target.indicateur.nom} · CSV ou Excel`

  return (
    <Modale
      open
      onClose={onClose}
      titre="Importer des valeurs"
      description={description}
      size={grille ? 'xl' : 'md'}
      footer={footer}
    >
      {body()}
    </Modale>
  )
}
