import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ModaleForm } from '@pilote/kpilote-ui/ModaleForm'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { ImportError } from '@/api/valeursImport'
import { useImportValeursBatch } from '@/mutations/valeursImport'
import { type ParseError } from './lecture/matriceVersRows'
import { useImportValeurs } from './useImportValeurs'
import { traduireErreursBatch, traduireIssuesValidation } from './traduireErreursBatch'
import { EncadreMessage } from './EncadreMessage'
import { ImportDropZone } from './ImportDropZone'
import { ImportFormatValide } from './ImportFormatValide'
import { NormalisationRevue } from './NormalisationRevue'
import type { ImportTarget } from './useImportModal'

const schema = z.object({
  file: z.instanceof(File, { message: 'Sélectionnez un fichier.' }),
})

type FormValues = z.infer<typeof schema>

const messageParseError = (error: ParseError): string => {
  switch (error.code) {
    case 'EMPTY':
      return 'Le fichier ne contient aucune ligne de données.'
    case 'TOO_MANY_ROWS':
      return `${error.count} lignes — la limite est de ${error.max} lignes par import. Scindez le fichier.`
    case 'MISSING_COLUMNS':
      return `Colonne(s) manquante(s) : ${error.missing.join(', ')}. Attendu : individu, date, valeur.`
    case 'UNREADABLE':
      return "Fichier illisible. Vérifiez qu'il s'agit d'un CSV ou d'un Excel valide."
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
  const mutation = useImportValeursBatch({ indicateurId: target.indicateur.id })
  const [erreursServeur, setErreursServeur] = useState<string[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { file: target.initialFile ?? null } as unknown as FormValues,
  })

  const file = useWatch({ control: form.control, name: 'file' }) ?? null

  const { etat, payload } = useImportValeurs({ file, indicateurId: target.indicateur.id })

  const onFileChange = (newFile: File) => {
    form.setValue('file', newFile, { shouldValidate: true })
    setErreursServeur([])
  }

  const genericToast = () => {
    toast({
      title: 'Import impossible.',
      description: 'Une erreur est survenue.',
      variant: 'error',
    })
  }

  const onSubmit = async () => {
    if (!payload || payload.length === 0) return
    setErreursServeur([])
    try {
      const result = await mutation.mutateAsync(payload)
      toast({
        title: 'Import réussi.',
        description: `${result.created} créée(s) · ${result.updated} mise(s) à jour`,
      })
      target.onSuccess?.()
      onClose()
    } catch (error) {
      if (error instanceof ImportError) {
        const d = error.detail
        if (d.type === 'BATCH_INVALID') {
          setErreursServeur(traduireErreursBatch({ details: d.details }))
        } else if (d.type === 'VALIDATION_ERROR') {
          setErreursServeur(traduireIssuesValidation({ issues: d.issues }))
        } else {
          genericToast()
        }
      } else {
        genericToast()
      }
    }
  }

  const submitLabel =
    payload && payload.length > 0
      ? `Importer ${payload.length} valeur${payload.length > 1 ? 's' : ''}`
      : 'Importer'

  const encadreChargement = (texte: string) => (
    <EncadreMessage>
      <span className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        {texte}
      </span>
    </EncadreMessage>
  )

  // Zone de dépôt + message d'erreur éventuel (format non parsable ou échec Albert)
  // invitant à re-déposer un fichier.
  const zoneDepot = (error?: ParseError) => (
    <>
      <ImportDropZone onFile={onFileChange} />
      {error ? <EncadreMessage variant="erreur">{messageParseError(error)}</EncadreMessage> : null}
    </>
  )

  const body = () => {
    switch (etat.kind) {
      case 'vide':
        return zoneDepot()
      case 'lecture':
        return encadreChargement('Analyse du fichier en cours…')
      case 'albertEnCours':
        return encadreChargement(
          'Format non standard détecté — extraction assistée par IA en cours…',
        )
      case 'standard':
        return (
          <ImportFormatValide
            nomFichier={etat.nomFichier}
            rows={etat.rows}
            erreursServeur={erreursServeur}
          />
        )
      case 'albertRevue':
        return <NormalisationRevue revue={etat.revue} erreursServeur={erreursServeur} />
      case 'illisible':
      case 'albertEchec':
        return zoneDepot(etat.error)
    }
  }

  return (
    <ModaleForm
      open
      onClose={onClose}
      titre="Importer des valeurs"
      description={`${target.indicateur.nom} · CSV ou Excel`}
      form={form}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      submitPendingLabel="Import en cours…"
      submitDisabled={!payload || payload.length === 0}
    >
      {body()}
    </ModaleForm>
  )
}
