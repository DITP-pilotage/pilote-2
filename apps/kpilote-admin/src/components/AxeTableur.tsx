import { ChevronDown, ChevronRight } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import {
  type Arbre,
  type ArbreNode,
  ancestorsOf,
  depthFirst,
  type Fonction,
  formatValue,
  type Kind,
  TOUS_ID,
} from '@/lib/axeArbre'
import { type Cellule, PERIODES, type SaisiesSerie, type StatutCellule } from '@/lib/axeSerie'
import { clsxm } from '@/lib/clsxm'

type CelluleRef = { id: string; index: number }

const KIND_DOT: Record<Kind, string> = {
  feuille: 'bg-success-425',
  parente: 'bg-primary',
  tous: 'bg-text',
}

const STATUT_LEGENDE: ReadonlyArray<{ statut: StatutCellule; label: string; exemple: string }> = [
  { statut: 'saisie', label: 'Saisie', exemple: '42' },
  { statut: 'reportee', label: 'Reportée', exemple: '↳ 42' },
  { statut: 'manquante', label: 'Manquante', exemple: '?' },
  { statut: 'absente', label: 'Jamais saisie', exemple: '·' },
  { statut: 'calculee', label: 'Calculée', exemple: '84' },
]

const STATUT_CELL: Record<StatutCellule, string> = {
  saisie: 'text-text',
  reportee: 'text-text-subtle italic',
  manquante: 'bg-warning-tinted/60 text-warning',
  absente: 'bg-surface-muted text-text-subtle',
  calculee: 'font-semibold text-text',
}

const ROW_INDENT = 16

export function AxeTableur({
  arbre,
  nomNiveau,
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
  nomNiveau: (ordre: number) => string
  collapsed: ReadonlySet<string>
  visible: ReadonlySet<string> | null
  fonction: Fonction
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
  const dependants = new Set(
    activeNode ? ancestorsOf({ arbre, id: activeNode.id }).map((node) => node.id) : [],
  )
  const tone = (ref: CelluleRef) => {
    if (!active || ref.index !== active.index) return undefined
    if (ref.id === active.id) return 'active'
    if (precedents.has(ref.id)) return 'precedent'
    if (dependants.has(ref.id)) return 'dependant'
    return undefined
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BarreFormule
        arbre={arbre}
        active={active}
        fonction={fonction}
        saisies={saisies}
        serie={serie}
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <HeaderCell className="left-0 z-30 w-10 text-center"> </HeaderCell>
              <HeaderCell className="left-10 z-30 min-w-72 text-left">Modalité</HeaderCell>
              <HeaderCell className="text-left">Niveau</HeaderCell>
              {PERIODES.map((periode, index) => (
                <HeaderCell
                  key={periode}
                  className={clsxm(
                    'w-28 text-right',
                    active?.index === index && 'bg-primary-tinted text-primary',
                  )}
                >
                  {periode} 2026
                </HeaderCell>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((node, rang) => (
              <Ligne
                key={node.id}
                node={node}
                rang={rang + 1}
                depth={node.niveau === 0 ? 0 : node.niveau}
                niveau={node.kind === 'tous' ? 'Résultat' : nomNiveau(node.niveau)}
                isCollapsed={!visible && collapsed.has(node.id)}
                canToggle={!visible && node.kind !== 'feuille' && node.children.length > 0}
                selected={selectedNodeId === node.id}
                saisies={saisies[node.id]}
                cellules={serie.get(node.id) ?? []}
                tone={(index) => tone({ id: node.id, index })}
                onToggle={() => onToggle(node.id)}
                onSelect={() => onSelectNode(node.id)}
                onActivate={(index) => setActive({ id: node.id, index })}
                onSaisie={(index, value) => onSaisie({ id: node.id, index, value })}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-6 py-2 text-xs text-text-muted">
        {STATUT_LEGENDE.map(({ statut, label, exemple }) => (
          <span key={statut} className="inline-flex items-center gap-1.5">
            <span
              className={clsxm(
                'inline-flex h-5 min-w-9 items-center justify-end rounded-sm border border-border px-1.5 tabular-nums',
                STATUT_CELL[statut],
              )}
            >
              {exemple}
            </span>
            {label}
          </span>
        ))}
        <span className="ml-auto">
          Un seul individu, valeurs d’exemple : rien n’est enregistré.
        </span>
      </div>
    </div>
  )
}

function HeaderCell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <th
      className={clsxm(
        'sticky top-0 z-20 border-r border-b border-border bg-surface-muted px-3 py-2 text-xs font-semibold whitespace-nowrap text-text-muted',
        className,
      )}
    >
      {children}
    </th>
  )
}

type Tone = 'active' | 'precedent' | 'dependant' | undefined

const TONE_CLASS: Record<Exclude<Tone, undefined>, string> = {
  active: 'relative z-10 outline-2 -outline-offset-2 outline-primary',
  precedent: 'bg-primary-tinted',
  dependant: 'bg-primary-tinted/40',
}

function Ligne({
  node,
  rang,
  depth,
  niveau,
  isCollapsed,
  canToggle,
  selected,
  saisies,
  cellules,
  tone,
  onToggle,
  onSelect,
  onActivate,
  onSaisie,
}: {
  node: ArbreNode
  rang: number
  depth: number
  niveau: string
  isCollapsed: boolean
  canToggle: boolean
  selected: boolean
  saisies: ReadonlyArray<string> | undefined
  cellules: ReadonlyArray<Cellule>
  tone: (index: number) => Tone
  onToggle: () => void
  onSelect: () => void
  onActivate: (index: number) => void
  onSaisie: (index: number, value: string) => void
}) {
  const isTous = node.kind === 'tous'
  const isFeuille = node.kind === 'feuille'
  const rowBg = isTous ? 'bg-surface-tinted' : 'bg-surface'
  return (
    <tr className={clsxm('group', !isFeuille && 'font-medium')}>
      <td
        className={clsxm(
          'sticky left-0 z-10 w-10 border-r border-b border-border bg-surface-muted text-center text-[11px] text-text-subtle tabular-nums',
        )}
      >
        {rang}
      </td>
      <td
        className={clsxm(
          'sticky left-10 z-10 border-r border-b border-border px-2 py-1',
          rowBg,
          selected && 'bg-primary-tinted',
        )}
      >
        <div className="flex items-center gap-1" style={{ paddingLeft: depth * ROW_INDENT }}>
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
            <span className={clsxm('size-2 shrink-0 rounded-full', KIND_DOT[node.kind])} />
            <span className={clsxm('truncate', isTous && 'font-semibold')}>{node.nom}</span>
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
          rowBg,
        )}
      >
        {niveau}
      </td>
      {PERIODES.map((periode, index) => {
        const cellule = cellules[index]
        const toneClass = tone(index)
        return (
          <td
            key={periode}
            className={clsxm(
              'h-8 w-28 border-r border-b border-border p-0 text-right tabular-nums',
              rowBg,
              cellule && STATUT_CELL[cellule.statut],
              toneClass && TONE_CLASS[toneClass],
            )}
          >
            {isFeuille ? (
              <input
                value={saisies?.[index] ?? ''}
                onFocus={() => onActivate(index)}
                onChange={(event) => onSaisie(index, event.target.value)}
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
                <ValeurCalculee cellule={cellule} />
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

function ValeurCalculee({ cellule }: { cellule: Cellule | undefined }) {
  if (!cellule || cellule.statut === 'absente') return <span className="font-normal">·</span>
  const incomplete = cellule.present < cellule.expected
  return (
    <>
      {incomplete ? (
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

function BarreFormule({
  arbre,
  active,
  fonction,
  saisies,
  serie,
}: {
  arbre: Arbre
  active: CelluleRef | null
  fonction: Fonction
  saisies: SaisiesSerie
  serie: Map<string, Cellule[]>
}) {
  const node = active ? arbre.get(active.id) : undefined
  return (
    <div className="flex min-h-12 items-stretch border-b border-border bg-surface text-sm">
      <div className="flex w-56 shrink-0 items-center border-r border-border px-3 text-xs font-medium text-text-muted">
        {node && active ? `${node.nom} · ${PERIODES[active.index]}` : 'Aucune cellule'}
      </div>
      <div className="flex shrink-0 items-center border-r border-border px-3 font-serif text-text-subtle italic">
        fx
      </div>
      <div className="flex min-w-0 flex-1 items-center px-3 py-2 text-text">
        {node && active ? (
          <Explication
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

function Explication({
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
  fonction: Fonction
  saisies: SaisiesSerie
  serie: Map<string, Cellule[]>
}) {
  const cellule = serie.get(node.id)?.[index]
  if (!cellule) return null
  const periode = PERIODES[index]

  if (node.kind === 'feuille') {
    switch (cellule.statut) {
      case 'saisie':
        return (
          <span>
            Saisie : {formatValue(cellule.value ?? 0)}. C’est une feuille, rien ne la calcule.
          </span>
        )
      case 'reportee': {
        const source = lastSaisieBefore({ saisies: saisies[node.id], index })
        return (
          <span>
            Rien de saisi en {periode} : la dernière valeur connue
            {source === null ? '' : ` (${PERIODES[source]})`},{' '}
            <strong>{formatValue(cellule.value ?? 0)}</strong>, est reportée.
          </span>
        )
      }
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

  const enfants = node.children
    .map((id) => ({ node: arbre.get(id), cellule: serie.get(id)?.[index] }))
    .filter(
      (enfant): enfant is { node: ArbreNode; cellule: Cellule } =>
        !!enfant.node && !!enfant.cellule,
    )
  const comptees = enfants.filter((enfant) => enfant.cellule.value !== null)
  const manquantes = enfants.filter(
    (enfant) => enfant.cellule.value === null && enfant.cellule.statut !== 'absente',
  )
  const ignorees = enfants.filter((enfant) => enfant.cellule.statut === 'absente')
  if (comptees.length === 0 && manquantes.length === 0) {
    return (
      <span className="text-text-muted">
        Aucun enfant saisi : elle n’existe pas pour cet individu.
      </span>
    )
  }
  const separateur = fonction === 'SUM' ? ' + ' : ', '
  const termes = comptees
    .map(
      (enfant) =>
        `${enfant.node.nom} ${formatValue(enfant.cellule.value ?? 0)}${enfant.cellule.statut === 'reportee' ? ' (reportée)' : ''}`,
    )
    .join(separateur)
  const formule = fonction === 'AVG' ? `moyenne(${termes})` : termes
  return (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-mono text-xs">
        = {formule || '∅'}
        {cellule.value === null ? null : (
          <strong className="text-sm"> = {formatValue(cellule.value)}</strong>
        )}
      </span>
      <span className="text-xs text-text-muted">
        couverture {cellule.present}/{cellule.expected}
      </span>
      {manquantes.length > 0 ? (
        <span className="text-xs text-warning">
          manquante{manquantes.length > 1 ? 's' : ''} :{' '}
          {manquantes.map((enfant) => enfant.node.nom).join(', ')}
        </span>
      ) : null}
      {ignorees.length > 0 ? (
        <span className="text-xs text-text-subtle">
          ignorée{ignorees.length > 1 ? 's' : ''} (jamais saisie{ignorees.length > 1 ? 's' : ''}) :{' '}
          {ignorees.map((enfant) => enfant.node.nom).join(', ')}
        </span>
      ) : null}
    </span>
  )
}
