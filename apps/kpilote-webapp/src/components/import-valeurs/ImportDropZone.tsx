import { type ChangeEvent, type DragEvent } from 'react'
import { Upload } from 'lucide-react'

// Zone de dépôt initiale (aucun fichier sélectionné) : drag'n'drop + input.
// `colonnes` : les colonnes attendues dans le format standard.
export function ImportDropZone({
  onFile,
  colonnes,
}: {
  onFile: (file: File) => void
  colonnes: ReadonlyArray<string>
}) {
  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0]
    if (picked) onFile(picked)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    const dropped = event.dataTransfer.files?.[0]
    if (dropped) onFile(dropped)
  }

  return (
    <label
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/60 px-6 py-12 text-center hover:bg-background"
    >
      <Upload className="size-10 text-text-subtle" />
      <div>
        <p className="text-sm font-medium text-text">Glissez un fichier ou parcourez</p>
        <p className="mt-1 text-xs text-text-subtle">
          CSV ou Excel · colonnes {colonnes.join(', ')} · 1000 lignes max
        </p>
        <p className="mt-1 text-xs text-text-subtle">
          Un tableau organisé autrement est lu par l’assistant IA, puis vous le vérifiez.
        </p>
      </div>
      <input type="file" accept=".csv,.xlsx" className="hidden" onChange={onInputChange} />
    </label>
  )
}
