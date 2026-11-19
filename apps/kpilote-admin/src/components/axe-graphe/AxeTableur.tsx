import { type FonctionAgregationAxe } from '@pilote/kpilote-shared/axe'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { KindMarker } from '@/components/axe-graphe/KindMarker'
import {
  ancestorsOf,
  type Arbre,
  type ArbreNode,
  depthFirst,
  formatValue,
  formulaOf,
  type Kind,
  pluralSuffix,
  TOUS_ID,
} from '@/lib/axeArbre'
import { type Cellule, type CelluleStatut, PERIODES, type SaisiesSerie } from '@/lib/axeSerie'
import { clsxm } from '@/lib/clsxm'

type CelluleRef = { id: string; index: number }

const STATUT_LEGEND: ReadonlyArray<{ statut: CelluleStatut; label: string; example: string }> = [
  { statut: 'saisie', label: 'Saisie', example: '42' },
  { statut: 'reportee', label: 'Reportée', example: '↳ 42' },
  { statut: 'manquante', label: 'Manquante', example: '?' },
  { statut: 'absente', label: 'Jamais saisie', example: '·' },
  { statut: 'calculee', label: 'Calculée', example: '84' },
]

const STATUT_CLASS: Record<CelluleStatut, string> = {
  saisie: 'text-text',
  reportee: 'text-text-subtle italic',
  manquante: 'bg-warning-tinted/60 text-warning',
  absente: 'text-text-subtle',
  calculee: 'text-text',
}

const ROW_INDENT = 16

// Même règle que le calcul croisé : une ligne blanche se saisit, une ligne teintée se calcule,
// plus foncée pour la marginale « Tous ».
const KIND_ROW_CLASS: Record<Kind, string> = {
  feuille: 'bg-surface',
  parente: 'bg-surface-muted font-semibold',
  tous: 'bg-surface-tinted font-bold',
}

type Tone = 'active' | 'precedent' | 'dependent'

const TONE_CLASS: Record<Tone, string> = {
  active: 'relative z-10 outline-2 -outline-offset-2 outline-primary',
  precedent: 'bg-primary-tinted',
  dependent: 'bg-primary-tinted/40',
}

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
  const rows = depthFirst({
    arbre,
    id: TOUS_ID,
    isOpen: (id) => (visible ? true : !collapsed.has(id)),
  }).filter((node) => !visible || visible.has(node.id))

  const activeNode = active ? arbre.get(active.id) : undefined
  const precedents = new Set(activeNode?.children ?? [])
  const dependents = new Set(
    activeNode ? ancestorsOf({ arbre, id: activeNode.id }).map((node) => node.id) : [],
  )
  const toneOf = (ref: CelluleRef): Tone | undefined => {
    if (!active || ref.index !== active.index) return undefined
    if (ref.id === active.id) return 'active'
    if (precedents.has(ref.id)) return 'precedent'
    if (dependents.has(ref.id)) return 'dependent'
    return undefined
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FormulaBar
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
              <HeaderCell className="left-0 z-30 w-10 text-center"> </HeaderCell>
              <HeaderCell className="left-10 z-30 min-w-56 text-left">Modalité</HeaderCell>
              <HeaderCell className="text-left">Niveau</HeaderCell>
              {PERIODES.map((periode, index) => (
                <HeaderCell
                  key={periode}
                  className={clsxm(
                    'min-w-28 text-right',
                    active?.index === index && 'bg-primary-tinted text-primary',
                  )}
                >
                  {periode} 2026
                </HeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((node, rank) => (
              <TableRow
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
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-6 py-2 text-xs text-text-muted">
        {STATUT_LEGEND.map(({ statut, label, example }) => (
          <span key={statut} className="inline-flex items-center gap-1.5">
            <span
              className={clsxm(
                'inline-flex h-5 min-w-9 items-center justify-end rounded-sm border border-border px-1.5 tabular-nums',
                statut === 'calculee' ? KIND_ROW_CLASS.parente : STATUT_CLASS[statut],
              )}
            >
              {example}
            </span>
            {label}
          </span>
        ))}
        <span className="ml-auto">
          Case blanche : saisie ; teintée : calculée, plus foncée pour « Tous ». Un seul individu,
          valeurs d’exemple : rien n’est enregistré.
        </span>
      </div>
    </div>
  )
}

function HeaderCell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <th
      className={clsxm(
        'sticky top-0 z-20 border-r border-b border-r-border border-b-border-strong bg-surface-muted px-3 py-2 text-xs font-semibold whitespace-nowrap text-text-muted',
        className,
      )}
    >
      {children}
    </th>
  )
}

function TableRow({
  node,
  rank,
  niveauNom,
  isCollapsed,
  canToggle,
  isSelected,
  saisies,
  cellules,
  toneOf,
  onToggle,
  onSelect,
  onActivate,
  onSaisie,
}: {
  node: ArbreNode
  rank: number
  niveauNom: string
  isCollapsed: boolean
  canToggle: boolean
  isSelected: boolean
  saisies: ReadonlyArray<string> | undefined
  cellules: ReadonlyArray<Cellule>
  toneOf: (index: number) => Tone | undefined
  onToggle: () => void
  onSelect: () => void
  onActivate: (index: number) => void
  onSaisie: (input: { index: number; value: string }) => void
}) {
  const rowClass = KIND_ROW_CLASS[node.kind]
  return (
    <tr className="group">
      <td className="sticky left-0 z-10 w-10 border-r border-b border-border bg-surface-muted text-center text-[11px] text-text-subtle tabular-nums">
        {rank}
      </td>
      <td
        className={clsxm(
          'sticky left-10 z-10 border-r border-b border-border px-2 py-1',
          rowClass,
          isSelected && 'bg-primary-tinted',
        )}
      >
        <div className="flex items-center gap-1" style={{ paddingLeft: node.niveau * ROW_INDENT }}>
          {canToggle ? (
            <button
              type="button"
              onClick={onToggle}
              aria-label={isCollapsed ? `Déplier ${node.nom}` : `Replier ${node.nom}`}
              className="flex size-5 items-center justify-center rounded text-text-muted hover:bg-surface-muted hover:text-primary"
            >
              {isCollapsed ? (
                <ChevronRight className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          ) : (
            <span className="size-5" />
          )}
          <button
            type="button"
            onClick={onSelect}
            className="flex min-w-0 items-center gap-2 text-left hover:text-primary"
          >
            <KindMarker kind={node.kind} />
            <span className={clsxm('truncate', node.kind === 'tous' && 'font-semibold')}>
              {node.nom}
            </span>
            {isCollapsed ? (
              <span className="shrink-0 text-[11px] font-normal text-text-subtle">
                ({node.children.length} enfants repliés)
              </span>
            ) : null}
          </button>
        </div>
      </td>
      <td
        className={clsxm(
          'border-r border-b border-border px-3 py-1 text-xs font-normal whitespace-nowrap text-text-muted',
          rowClass,
        )}
      >
        {niveauNom}
      </td>
      {PERIODES.map((periode, index) => {
        const cellule = cellules[index]
        const tone = toneOf(index)
        return (
          <td
            key={periode}
            className={clsxm(
              'h-8 min-w-28 border-r border-b border-border p-0 text-right tabular-nums',
              rowClass,
              cellule && STATUT_CLASS[cellule.statut],
              tone && TONE_CLASS[tone],
            )}
          >
            {node.kind === 'feuille' ? (
              <input
                value={saisies?.[index] ?? ''}
                onFocus={() => onActivate(index)}
                onChange={(event) => onSaisie({ index, value: event.target.value })}
                placeholder={placeholderOf(cellule)}
                inputMode="decimal"
                aria-label={`${node.nom}, ${periode}`}
                className="h-full w-full bg-transparent px-3 text-right tabular-nums not-italic outline-none placeholder:text-inherit"
              />
            ) : (
              <button
                type="button"
                onClick={() => onActivate(index)}
                className="flex h-full w-full items-center justify-end gap-1 px-3"
              >
                <ComputedValue cellule={cellule} />
              </button>
            )}
          </td>
        )
      })}
    </tr>
  )
}

const placeholderOf = (cellule: Cellule | undefined): string => {
  if (!cellule) return ''
  if (cellule.statut === 'reportee' && cellule.value !== null) {
    return `↳ ${formatValue(cellule.value)}`
  }
  if (cellule.statut === 'manquante') return '?'
  if (cellule.statut === 'absente') return '·'
  return ''
}

function ComputedValue({ cellule }: { cellule: Cellule | undefined }) {
  if (!cellule || cellule.statut === 'absente') return <span className="font-normal">·</span>
  const isIncomplete = cellule.present < cellule.expected
  return (
    <>
      {isIncomplete ? (
        <span className="text-[10px] font-normal text-warning-425">
          {cellule.present}/{cellule.expected}
        </span>
      ) : null}
      <span className={clsxm(cellule.value === null && 'font-normal text-warning')}>
        {cellule.value === null ? '?' : formatValue(cellule.value)}
      </span>
    </>
  )
}

function FormulaBar({
  arbre,
  active,
  fonction,
  saisies,
  serie,
}: {
  arbre: Arbre
  active: CelluleRef | null
  fonction: FonctionAgregationAxe
  saisies: SaisiesSerie
  serie: Map<string, Cellule[]>
}) {
  const node = active ? arbre.get(active.id) : undefined
  const reference = node && active ? `${node.nom} · ${PERIODES[active.index]}` : 'Aucune cellule'
  return (
    <div className="flex min-h-12 items-stretch border-b border-border bg-surface text-sm">
      <div className="flex w-56 shrink-0 items-center border-r border-border px-3 text-xs font-medium text-text-muted">
        {reference}
      </div>
      <div className="flex shrink-0 items-center border-r border-border px-3 font-serif text-text-subtle italic">
        fx
      </div>
      <div className="flex min-w-0 flex-1 items-center px-3 py-2 text-text">
        {node && active ? (
          <Explanation
            arbre={arbre}
            node={node}
            index={active.index}
            fonction={fonction}
            saisies={saisies}
            serie={serie}
          />
        ) : (
          <span className="text-text-muted">
            Cliquez sur une cellule pour voir d’où vient sa valeur : ses sources s’allument en bleu.
          </span>
        )}
      </div>
    </div>
  )
}

const lastSaisieBefore = ({
  saisies,
  index,
}: {
  saisies: ReadonlyArray<string> | undefined
  index: number
}): number | null => {
  for (let periode = index - 1; periode >= 0; periode--) {
    if (saisies?.[periode]?.trim()) return periode
  }
  return null
}

function Explanation({
  arbre,
  node,
  index,
  fonction,
  saisies,
  serie,
}: {
  arbre: Arbre
  node: ArbreNode
  index: number
  fonction: FonctionAgregationAxe
  saisies: SaisiesSerie
  serie: Map<string, Cellule[]>
}) {
  const cellule = serie.get(node.id)?.[index]
  if (!cellule) return null
  if (node.kind === 'feuille') {
    return (
      <FeuilleExplanation
        cellule={cellule}
        index={index}
        source={lastSaisieBefore({ saisies: saisies[node.id], index })}
      />
    )
  }

  const children = node.children.flatMap((id) => {
    const child = arbre.get(id)
    const childCellule = serie.get(id)?.[index]
    return child && childCellule ? [{ node: child, cellule: childCellule }] : []
  })
  const counted = children.filter((child) => child.cellule.value !== null)
  const missing = children.filter(
    (child) => child.cellule.value === null && child.cellule.statut !== 'absente',
  )
  const ignored = children.filter((child) => child.cellule.statut === 'absente')
  if (counted.length === 0 && missing.length === 0) {
    return (
      <span className="text-text-muted">
        Aucun enfant saisi : elle n’existe pas pour cet individu.
      </span>
    )
  }
  const terms = counted.map((child) => {
    const reporteeSuffix = child.cellule.statut === 'reportee' ? ' (reportée)' : ''
    return `${child.node.nom} ${formatValue(child.cellule.value ?? 0)}${reporteeSuffix}`
  })
  return (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-mono text-xs">
        = {terms.length === 0 ? '∅' : formulaOf({ terms, fonction })}
        {cellule.value === null ? null : (
          <strong className="text-sm"> = {formatValue(cellule.value)}</strong>
        )}
      </span>
      <span className="text-xs text-text-muted">
        couverture {cellule.present}/{cellule.expected}
      </span>
      {missing.length > 0 ? (
        <span className="text-xs text-warning">
          manquante{pluralSuffix(missing.length)} :{' '}
          {missing.map((child) => child.node.nom).join(', ')}
        </span>
      ) : null}
      {ignored.length > 0 ? (
        <span className="text-xs text-text-subtle">
          ignorée{pluralSuffix(ignored.length)} (jamais saisie{pluralSuffix(ignored.length)}) :{' '}
          {ignored.map((child) => child.node.nom).join(', ')}
        </span>
      ) : null}
    </span>
  )
}

function FeuilleExplanation({
  cellule,
  index,
  source,
}: {
  cellule: Cellule
  index: number
  source: number | null
}) {
  const periode = PERIODES[index]
  switch (cellule.statut) {
    case 'saisie':
      return (
        <span>
          Saisie : {formatValue(cellule.value ?? 0)}. C’est une feuille, rien ne la calcule.
        </span>
      )
    case 'reportee':
      return (
        <span>
          Rien de saisi en {periode} : la dernière valeur connue
          {source === null ? '' : ` (${PERIODES[source]})`},{' '}
          <strong>{formatValue(cellule.value ?? 0)}</strong>, est reportée.
        </span>
      )
    case 'manquante':
      return (
        <span className="text-warning">
          Saisie à d’autres périodes, donc attendue, mais pas encore de valeur en {periode} : elle
          manque, et la couverture de ses parents baisse.
        </span>
      )
    default:
      return (
        <span className="text-text-muted">
          Jamais saisie : elle n’existe pas pour cet individu. Elle ne compte ni comme 0, ni comme
          une valeur manquante.
        </span>
      )
  }
}
