// Ligne d'option standard des Pickers : nom lisible + identifiant public en mono.
export function PickerOptionNomId({ nom, id }: { nom: string; id: string }) {
  return (
    <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <span className="truncate text-sm text-text">{nom}</span>
      <span className="shrink-0 font-mono text-xs text-text-muted">{id}</span>
    </span>
  )
}
