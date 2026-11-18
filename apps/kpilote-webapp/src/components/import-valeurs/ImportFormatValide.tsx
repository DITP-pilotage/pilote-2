import { ErreursServeurBloc } from './ErreursServeurBloc'
import { ImportPreviewTable } from './ImportPreviewTable'
import { type AxeImport, type ParsedRow } from './lecture/matriceVersRows'

// Fichier au format standard : entête récapitulatif + aperçu des lignes.
export function ImportFormatValide({
  nomFichier,
  rows,
  axes,
  erreursServeur,
}: {
  nomFichier: string | undefined
  rows: ParsedRow[]
  axes: ReadonlyArray<AxeImport>
  erreursServeur: string[]
}) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-text">
          {nomFichier} · {rows.length} ligne{rows.length > 1 ? 's' : ''}
        </span>
      </div>
      <ErreursServeurBloc messages={erreursServeur} />
      <ImportPreviewTable rows={rows} axes={axes} />
    </>
  )
}
