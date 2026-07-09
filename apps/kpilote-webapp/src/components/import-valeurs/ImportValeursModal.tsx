import { Dialog as DialogPrimitive } from 'radix-ui'
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { ImportError } from '@/api/valeursImport'
import { useImportValeursBatch } from '@/mutations/valeursImport'
import { parseFichierValeurs, type ParseResult } from './parseFichierValeurs'
import { traduireErreursBatch } from './traduireErreursBatch'
import { ImportPreviewTable } from './ImportPreviewTable'
import type { ImportTarget } from './useImportModal'

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
  const mutation = useImportValeursBatch({ indicateurId: target.indicateurId })
  const [nomFichier, setNomFichier] = useState<string | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [erreursServeur, setErreursServeur] = useState<string[]>([])

  const generationRef = useRef(0)

  const traiterFichier = async (file: File) => {
    const generation = ++generationRef.current
    setNomFichier(file.name)
    setErreursServeur([])
    const result = await parseFichierValeurs({ file })
    if (generation !== generationRef.current) return
    setParseResult(result)
  }

  const initialFile = target.initialFile
  useEffect(() => {
    if (!initialFile) return
    const generation = ++generationRef.current
    void parseFichierValeurs({ file: initialFile }).then((result) => {
      if (generation !== generationRef.current) return
      setNomFichier(initialFile.name)
      setErreursServeur([])
      setParseResult(result)
    })
  }, [initialFile])

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void traiterFichier(file)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) void traiterFichier(file)
  }

  const rows = parseResult?.ok ? parseResult.rows : null

  const onSubmit = () => {
    if (!rows) return
    setErreursServeur([])
    mutation.mutate(rows, {
      onSuccess: (result) => {
        toast({
          title: 'Import réussi.',
          description: `${result.created} créée(s) · ${result.updated} mise(s) à jour`,
        })
        target.onSuccess?.()
        onClose()
      },
      onError: (error) => {
        if (error instanceof ImportError) {
          const detail = error.detail
          if (detail.type === 'BATCH_INVALID') {
            setErreursServeur(traduireErreursBatch({ details: detail.details }))
          } else {
            toast({
              title: 'Import impossible.',
              description: 'Une erreur est survenue.',
              variant: 'error',
            })
          }
        } else {
          toast({
            title: 'Import impossible.',
            description: 'Une erreur est survenue.',
            variant: 'error',
          })
        }
      },
    })
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(ouvert) => (ouvert ? undefined : onClose())}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[8vh] z-50 flex max-h-[84vh] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.22)] focus:outline-none">
          <div className="flex items-start justify-between border-b border-border px-6 py-4">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold text-text">
                Importer des valeurs
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-0.5 text-sm text-text-muted">
                {target.indicateurNom} · CSV ou Excel
              </DialogPrimitive.Description>
            </div>
            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              className="rounded-md p-1.5 text-text-subtle hover:bg-background hover:text-text"
            >
              <X className="size-[18px]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {rows ? (
              <>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-text">
                    {nomFichier} · {rows.length} ligne{rows.length > 1 ? 's' : ''}
                  </span>
                </div>
                {erreursServeur.length > 0 ? (
                  <div className="mb-3 rounded-lg border border-accent-rouge/30 bg-accent-rouge/5 px-4 py-3 text-sm">
                    <p className="font-medium text-accent-rouge">
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
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={onInputChange}
                  />
                </label>
                {parseResult && !parseResult.ok ? (
                  <p className="mt-3 rounded-lg border border-accent-rouge/30 bg-accent-rouge/5 px-4 py-3 text-sm text-accent-rouge">
                    {messageParseError(parseResult)}
                  </p>
                ) : null}
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border bg-background/60 px-6 py-4">
            <Button variant="secondary" size="md" onClick={onClose}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!rows || mutation.isPending}
              onClick={onSubmit}
            >
              {mutation.isPending
                ? 'Import en cours…'
                : rows
                  ? `Importer ${rows.length} valeur${rows.length > 1 ? 's' : ''}`
                  : 'Importer'}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
