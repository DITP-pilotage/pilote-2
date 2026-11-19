import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'
import { useState } from 'react'

import { StatutLegend } from '@/components/axe-graphe/StatutLegend'
import { TableurFormulaBar } from '@/components/axe-graphe/TableurFormulaBar'
import { TableurHeaderCell } from '@/components/axe-graphe/TableurHeaderCell'
import { TableurRow } from '@/components/axe-graphe/TableurRow'
import { type Arbre } from '@/lib/axeArbre'
import { type Cellule, PERIODES, type SaisiesSerie } from '@/lib/axeSerie'
import { buildToneOf, type CelluleRef, tableurRowsOf } from '@/lib/axeTableur'
import { clsxm } from '@/lib/clsxm'

export function AxeTableur({
  arbre,
  niveauNomOf,
  collapsed,
  visible,
  fonction,
  saisies,
  serie,
  selectedNodeId,
  onToggle,
  onSelectNode,
  onSaisie,
}: {
  arbre: Arbre
  niveauNomOf: (ordre: number) => string
  collapsed: ReadonlySet<string>
  visible: ReadonlySet<string> | null
  fonction: FonctionAgregationAxe
  saisies: SaisiesSerie
  serie: Map<string, Cellule[]>
  selectedNodeId: string | null
  onToggle: (id: string) => void
  onSelectNode: (id: string) => void
  onSaisie: (input: { id: string; index: number; value: string }) => void
}) {
  const [active, setActive] = useState<CelluleRef | null>(null)
  const rows = tableurRowsOf({ arbre, collapsed, visible })
  const toneOf = buildToneOf({ arbre, active })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TableurFormulaBar
        arbre={arbre}
        active={active}
        fonction={fonction}
        saisies={saisies}
        serie={serie}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <TableurHeaderCell className="left-0 z-30 w-10 text-center"> </TableurHeaderCell>
              <TableurHeaderCell className="left-10 z-30 min-w-56 text-left">
                Modalité
              </TableurHeaderCell>
              <TableurHeaderCell className="text-left">Niveau</TableurHeaderCell>
              {PERIODES.map((periode, index) => (
                <TableurHeaderCell
                  key={periode}
                  className={clsxm(
                    'min-w-28 text-right',
                    active?.index === index && 'bg-primary-tinted text-primary',
                  )}
                >
                  {periode} 2026
                </TableurHeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((node, rank) => (
              <TableurRow
                key={node.id}
                node={node}
                rank={rank + 1}
                niveauNom={node.kind === 'tous' ? 'Résultat' : niveauNomOf(node.niveau)}
                isCollapsed={!visible && collapsed.has(node.id)}
                canToggle={!visible && node.kind !== 'feuille' && node.children.length > 0}
                isSelected={selectedNodeId === node.id}
                saisies={saisies[node.id]}
                cellules={serie.get(node.id) ?? []}
                toneOf={(index) => toneOf({ id: node.id, index })}
                onToggle={() => onToggle(node.id)}
                onSelect={() => onSelectNode(node.id)}
                onActivate={(index) => setActive({ id: node.id, index })}
                onSaisie={({ index, value }) => onSaisie({ id: node.id, index, value })}
              />
            ))}
          </tbody>
        </table>
      </div>
      <StatutLegend />
    </div>
  )
}
