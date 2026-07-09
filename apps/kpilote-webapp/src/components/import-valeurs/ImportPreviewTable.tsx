import type { ParsedRow } from './parseFichierValeurs'

const MAX_LIGNES_AFFICHEES = 100

export function ImportPreviewTable({ rows }: { rows: ParsedRow[] }) {
  const visibles = rows.slice(0, MAX_LIGNES_AFFICHEES)
  const reste = rows.length - visibles.length

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-background text-xs uppercase tracking-wide text-text-subtle">
          <tr>
            <th className="px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">individu</th>
            <th className="px-4 py-2 font-medium">date</th>
            <th className="px-4 py-2 font-medium">valeur</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border font-mono text-[13px]">
          {visibles.map((row, index) => (
            <tr key={index}>
              <td className="px-4 py-2 text-text-subtle">{index + 2}</td>
              <td className="px-4 py-2">{row.individu}</td>
              <td className="px-4 py-2">{row.date}</td>
              <td className="px-4 py-2">{String(row.valeur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {reste > 0 ? (
        <div className="border-t border-border bg-background px-4 py-2 text-center text-xs text-text-subtle">
          … et {reste} autre{reste > 1 ? 's' : ''} ligne{reste > 1 ? 's' : ''}
        </div>
      ) : null}
    </div>
  )
}
