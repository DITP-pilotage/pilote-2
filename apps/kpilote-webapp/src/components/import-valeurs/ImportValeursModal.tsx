import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { ModaleForm } from '@pilote/kpilote-ui/ModaleForm'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { ImportError } from '@/api/valeursImport'
import { useImportValeursBatch } from '@/mutations/valeursImport'
import { normaliserValeursQueryOptions } from '@/queries/valeursNormaliser'
import { parseFichierValeurs, type ParseResult } from './parseFichierValeurs'
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

const messageParseError = (result: Extract<ParseResult, { ok: false }>): string => {
  switch (result.error.code) {
    case 'EMPTY':
      return 'Le fichier ne contient aucune ligne de données.'
    case 'TOO_MANY_ROWS':
      return `${result.error.count} lignes — la limite est de ${result.error.max} lignes par import. Scindez le fichier.`
    case 'MISSING_COLUMNS':
      return `Colonne(s) manquante(s) : ${result.error.missing.join(', ')}. Attendu : individu, date, valeur.`
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

  const file = useWatch({ control: form.control, name: 'file' })

  const parseQuery = useQuery({
    queryKey: ['import-parse', file?.name, file?.size, file?.lastModified],
    queryFn: () => {
      // `enabled: file != null` guarantees file is defined when queryFn runs
      if (!file) throw new Error('file attendu')
      return parseFichierValeurs({ file })
    },
    enabled: file != null,
  })

  const parseResult = parseQuery.data
  const rows = parseResult?.ok ? parseResult.rows : null

  // Fichier hors format standard (colonnes manquantes) → extraction assistée par
  // Albert. La query est désactivée (skipToken) tant qu'aucun tel fichier n'est
  // détecté, donc `revue` se réinitialise seul au changement de fichier.
  const fichierHorsFormat =
    file && parseResult && !parseResult.ok && parseResult.error.code === 'MISSING_COLUMNS'
      ? { file, message: messageParseError(parseResult) }
      : null

  const albertQuery = useQuery(
    normaliserValeursQueryOptions({
      indicateurId: target.indicateur.id,
      file: fichierHorsFormat?.file ?? null,
    }),
  )
  const revue = albertQuery.data?.isOk() ? albertQuery.data.value : null
  const albertEchec = albertQuery.data?.isErr() === true || albertQuery.isError

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

  // En mode revue, on importe le sous-ensemble résolu par Albert ; sinon le parse standard.
  const payload = revue ? revue.items : rows

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

  const body = () => {
    if (revue) return <NormalisationRevue revue={revue} erreursServeur={erreursServeur} />
    if (rows)
      return (
        <ImportFormatValide nomFichier={file?.name} rows={rows} erreursServeur={erreursServeur} />
      )

    // Traitement en cours : on masque la zone de dépôt, seul le statut s'affiche.
    if (file && parseQuery.isPending) return encadreChargement('Analyse du fichier en cours…')
    if (fichierHorsFormat && !albertEchec)
      return encadreChargement('Format non standard détecté — extraction assistée par IA en cours…')

    // Sinon : zone de dépôt, avec un message d'erreur éventuel pour re-déposer.
    return (
      <>
        <ImportDropZone onFile={onFileChange} />
        {messageErreurSaisie()}
      </>
    )
  }

  const messageErreurSaisie = () => {
    if (fichierHorsFormat && albertEchec)
      return <EncadreMessage variant="erreur">{fichierHorsFormat.message}</EncadreMessage>
    if (parseResult && !parseResult.ok && parseResult.error.code !== 'MISSING_COLUMNS')
      return <EncadreMessage variant="erreur">{messageParseError(parseResult)}</EncadreMessage>
    return null
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
