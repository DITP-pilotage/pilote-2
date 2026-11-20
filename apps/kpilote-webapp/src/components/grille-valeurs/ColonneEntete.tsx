import { clsxm } from '@/lib/clsxm'
import { type ColonneGrille } from '@/lib/grilleValeurs'

export function ColonneEntete({ colonne }: { colonne: ColonneGrille }) {
  return (
    <th
      scope="col"
      className={clsxm(
        'sticky top-0 z-[2] border-b border-r border-border-strong bg-surface-muted px-3 font-bold last:border-r-0',
        colonne.type === 'VALEUR' ? 'text-right' : 'text-left',
      )}
    >
      {colonne.label}
      {colonne.type === 'AXE' ? (
        <span className="ml-1.5 rounded bg-primary-tinted px-1.5 py-0.5 text-[11px] font-medium text-primary">
          Axe
        </span>
      ) : null}
    </th>
  )
}
