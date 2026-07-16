import { useState, type ChangeEvent, type DragEvent } from 'react'
import { Upload } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import type { NormaliserValeursImportResponseApiModel } from '@pilote/kpilote-shared/valeurImport'
import { ModaleForm } from '@pilote/kpilote-ui/ModaleForm'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { ImportError } from '@/api/valeursImport'
import { useImportValeursBatch } from '@/mutations/valeursImport'
import { parseFichierValeurs, type ParseResult } from './parseFichierValeurs'
import { AlbertFallback } from './AlbertFallback'
import { traduireErreursBatch, traduireIssuesValidation } from './traduireErreursBatch'
import { ImportPreviewTable } from './ImportPreviewTable'
import { NormalisationReviewView } from './NormalisationReviewView'
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
  const [revue, setRevue] = useState<NormaliserValeursImportResponseApiModel | null>(null)

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
  // Sur MISSING_COLUMNS : extraction assistée par Albert via <AlbertFallback>,
  // qui remonte la revue ici (setRevue) en cas de succès.
  const fichierHorsFormat =
    file && parseResult && !parseResult.ok && parseResult.error.code === 'MISSING_COLUMNS'
      ? { file, message: messageParseError(parseResult) }
      : null

  const onFileChange = (newFile: File) => {
    form.setValue('file', newFile, { shouldValidate: true })
    setErreursServeur([])
    setRevue(null)
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0]
    if (picked) onFileChange(picked)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) onFileChange(dropped)
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
      {revue ? (
        <>
          {erreursServeur.length > 0 ? (
            <div className="mb-3 rounded-lg border border-red-marianne/30 bg-red-marianne/5 px-4 py-3 text-sm">
              <p className="font-medium text-red-marianne">
                Aucune valeur n'a été appliquée. Corrigez puis réessayez :
              </p>
              <ul className="mt-2 space-y-1">
                {erreursServeur.map((message, index) => (
                  <li key={index} className="text-text-muted">
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <NormalisationReviewView response={revue} />
        </>
      ) : rows ? (
        <>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-text">
              {file?.name} · {rows.length} ligne{rows.length > 1 ? 's' : ''}
            </span>
          </div>
          {erreursServeur.length > 0 ? (
            <div className="mb-3 rounded-lg border border-red-marianne/30 bg-red-marianne/5 px-4 py-3 text-sm">
              <p className="font-medium text-red-marianne">
                Aucune valeur n'a été appliquée. Corrigez puis réessayez :
              </p>
              <ul className="mt-2 space-y-1">
                {erreursServeur.map((message, index) => (
                  <li key={index} className="text-text-muted">
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <ImportPreviewTable rows={rows} />
        </>
      ) : (
        <>
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/60 px-6 py-12 text-center hover:bg-background"
          >
            <Upload className="size-10 text-text-subtle" />
            <div>
              <p className="text-sm font-medium text-text">Glissez un fichier ou parcourez</p>
              <p className="mt-1 text-xs text-text-subtle">
                CSV ou Excel · colonnes individu, date, valeur · 1000 lignes max
              </p>
            </div>
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={onInputChange} />
          </label>
          {fichierHorsFormat ? (
            <AlbertFallback
              file={fichierHorsFormat.file}
              indicateurId={target.indicateur.id}
              onResolved={setRevue}
              messageSiEchec={fichierHorsFormat.message}
            />
          ) : parseResult && !parseResult.ok ? (
            <p className="mt-3 rounded-lg border border-red-marianne/30 bg-red-marianne/5 px-4 py-3 text-sm text-red-marianne">
              {messageParseError(parseResult)}
            </p>
          ) : null}
        </>
      )}
    </ModaleForm>
  )
}
