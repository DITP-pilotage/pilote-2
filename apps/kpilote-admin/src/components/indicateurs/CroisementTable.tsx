import { AlertTriangle, ChevronDown, ChevronRight, Dices, Eraser, Grid3x3 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { CroisementFormulaBar } from '@/components/indicateurs/CroisementFormulaBar'
import { FixedAxeSelect } from '@/components/indicateurs/FixedAxeSelect'
import { Button } from '@pilote/kpilote-ui/Button'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import {
  type Arbre,
  type ArbreNode,
  depthFirst,
  formatValue,
  initialCollapsed,
  type Kind,
  nodesOfKind,
  TOUS_ID,
  toggleInSet,
} from '@/lib/axeArbre'
import {
  type AxeCroise,
  buildCroisement,
  buildSampleCroise,
  type CelluleCroisee,
  type CelluleIds,
  celluleKey,
  countCombinaisons,
  type Layout,
  MAX_COMBINAISONS,
  withColumnsAxe,
  withRowsAxe,
} from '@/lib/axesCroises'
import { clsxm } from '@/lib/clsxm'

const AUTO_COLLAPSE_AT = 40
const ROW_INDENT = 16

const rowsOf = ({
  arbre,
  collapsed,
}: {
  arbre: Arbre | undefined
  collapsed: ReadonlySet<string>
}): ArbreNode[] =>
  arbre ? depthFirst({ arbre, id: TOUS_ID, isOpen: (id) => !collapsed.has(id) }) : []

const firstFeuilleOf = (arbre: Arbre): string | undefined =>
  depthFirst({ arbre, id: TOUS_ID, isOpen: () => true }).find((node) => node.kind === 'feuille')?.id

const referenceOf = ({ axes, ids }: { axes: ReadonlyArray<AxeCroise>; ids: CelluleIds }): string =>
  ids
    .map((id, index) => {
      const axe = axes[index]
      const nom = axe?.arbre.get(id)?.nom ?? id
      return id === TOUS_ID ? nom : `${axe?.nom ?? ''} : ${nom}`
    })
    .join(' × ')

const warningsOf = (axes: ReadonlyArray<AxeCroise>): string[] => {
  const axeWarnings = axes.flatMap((axe, index) => {
    const feuilleCount = nodesOfKind({ arbre: axe.arbre, kind: 'feuille' }).length
    if (feuilleCount === 0) {
      return [`L’axe ${index + 1} « ${axe.nom} » n’a aucune modalité : rien à saisir.`]
    }
    if (feuilleCount === 1) {
      return [
        `L’axe ${index + 1} « ${axe.nom} » n’a qu’une modalité feuille : le découper ne change aucune valeur, « Tous » vaut cette modalité.`,
      ]
    }
    return []
  })
  const isSampled = countCombinaisons(axes) > MAX_COMBINAISONS
  const sampleWarning = `Plus de ${formatValue(MAX_COMBINAISONS)} combinaisons de feuilles : l’exemple n’en remplit qu’une partie, tirée au hasard.`
  return isSampled ? [...axeWarnings, sampleWarning] : axeWarnings
}

type Tone = 'active' | 'precedent'

const TONE_CLASS: Record<Tone, string> = {
  active: 'relative z-10 outline-2 -outline-offset-2 outline-primary',
  precedent: 'bg-primary-tinted',
}

const toneOf = ({
  key,
  activeKey,
  precedents,
}: {
  key: string
  activeKey: string | null
  precedents: ReadonlySet<string>
}): Tone | undefined => {
  if (key === activeKey) return 'active'
  if (precedents.has(key)) return 'precedent'
  return undefined
}

// 0 : croise deux feuilles ; 1 : une parente ; 2 : « Tous ». Une case blanche se saisit, une
// case teintée se calcule, plus foncée pour la marginale.
type Emphasis = 0 | 1 | 2

const emphasisOf = (kind: Kind | undefined): Emphasis => {
  if (kind === 'tous') return 2
  if (kind === 'parente') return 1
  return 0
}

const strongerEmphasis = ({ first, second }: { first: Emphasis; second: Emphasis }): Emphasis =>
  first >= second ? first : second

const EMPHASIS_CLASS: Record<Emphasis, string> = {
  0: 'bg-surface font-normal',
  1: 'bg-surface-muted font-semibold',
  2: 'bg-surface-tinted font-bold',
}

export function CroisementTable({ axes }: { axes: ReadonlyArray<AxeCroise> }) {
  const [seed, setSeed] = useState(1)
  const [saisies, setSaisies] = useState(() => buildSampleCroise({ axes }))
  const [layout, setLayout] = useState<Layout>({ rows: 0, columns: axes.length > 1 ? 1 : null })
  const [collapsedByAxe, setCollapsedByAxe] = useState<Record<string, ReadonlySet<string>>>(() =>
    Object.fromEntries(
      axes.map((axe) => [
        axe.id,
        initialCollapsed({ arbre: axe.arbre, threshold: AUTO_COLLAPSE_AT }),
      ]),
    ),
  )
  // Un axe fixé part sur sa première feuille : les cases feuille × feuille sont saisissables.
  const [fixedIds, setFixedIds] = useState<ReadonlyArray<string>>(() =>
    axes.map((axe) => firstFeuilleOf(axe.arbre) ?? TOUS_ID),
  )
  const [active, setActive] = useState<CelluleIds | null>(null)

  const resolve = useMemo(() => buildCroisement({ axes, saisies }), [axes, saisies])
  const hasSaisissable = countCombinaisons(axes) > 0
  const randomize = (full: boolean) => {
    const nextSeed = seed + 1
    setSeed(nextSeed)
    setSaisies(buildSampleCroise({ axes, seed: nextSeed, full }))
  }
  const rowsAxe = axes[layout.rows]
  const columnsAxe = layout.columns === null ? undefined : axes[layout.columns]
  const collapsedOf = (axe: AxeCroise | undefined): ReadonlySet<string> =>
    (axe ? collapsedByAxe[axe.id] : undefined) ?? new Set<string>()
  const toggleNode = ({ axe, id }: { axe: AxeCroise; id: string }) =>
    setCollapsedByAxe((current) => ({
      ...current,
      [axe.id]: toggleInSet({ set: current[axe.id] ?? new Set(), id }),
    }))
  const changeLayout = (next: Layout) => {
    setLayout(next)
    setActive(null)
  }

  if (!rowsAxe) {
    return <p className="p-6 text-sm text-text-muted">Déclarez au moins un axe.</p>
  }

  const rows = rowsOf({ arbre: rowsAxe.arbre, collapsed: collapsedOf(rowsAxe) })
  const columns: ReadonlyArray<ArbreNode | undefined> = columnsAxe
    ? rowsOf({ arbre: columnsAxe.arbre, collapsed: collapsedOf(columnsAxe) })
    : [undefined]
  const idsOf = ({ row, column }: { row: string; column: string | undefined }): CelluleIds =>
    axes.map((_, index) => {
      if (index === layout.rows) return row
      if (index === layout.columns) return column ?? TOUS_ID
      return fixedIds[index] ?? TOUS_ID
    })
  const fixedAxes = axes
    .map((axe, index) => ({ axe, index }))
    .filter(({ index }) => index !== layout.rows && index !== layout.columns)
  const warnings = warningsOf(axes)
  const activeCellule = active ? resolve(active) : null
  const precedents = new Set((activeCellule?.children ?? []).map(celluleKey))
  const activeKey = active ? celluleKey(active) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-border px-6 py-3">
        <AxeSelect
          label="Lignes"
          axes={axes}
          value={layout.rows}
          onChange={(index) => {
            if (index !== null) changeLayout(withRowsAxe({ layout, index }))
          }}
        />
        {axes.length > 1 ? (
          <AxeSelect
            label="Colonnes"
            axes={axes}
            value={layout.columns}
            allowNone
            onChange={(index) => changeLayout(withColumnsAxe({ layout, index }))}
          />
        ) : null}
        {fixedAxes.map(({ axe, index }) => (
          <FixedAxeSelect
            key={axe.id}
            axe={axe}
            index={index}
            value={fixedIds[index] ?? TOUS_ID}
            onChange={(id) => {
              setActive(null)
              setFixedIds((current) =>
                current.map((fixedId, position) => (position === index ? id : fixedId)),
              )
            }}
          />
        ))}
        <span className="ml-auto flex items-center gap-1 self-center">
          <Button
            size="sm"
            variant="tertiary"
            title="Valeurs au hasard, avec des cases vides"
            disabled={!hasSaisissable}
            onClick={() => randomize(false)}
          >
            <Dices />
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            title="Valeurs au hasard, sans case vide"
            disabled={!hasSaisissable}
            onClick={() => randomize(true)}
          >
            <Grid3x3 />
          </Button>
          <Button size="sm" variant="tertiary" title="Vider" onClick={() => setSaisies({})}>
            <Eraser />
          </Button>
        </span>
      </div>

      {warnings.length > 0 ? (
        <ul className="m-0 flex flex-col gap-1 border-b border-border bg-warning-tinted px-6 py-2 text-xs text-warning">
          {warnings.map((warning) => (
            <li key={warning} className="flex items-center gap-2">
              <AlertTriangle className="size-3.5 shrink-0" />
              {warning}
            </li>
          ))}
        </ul>
      ) : null}

      <CroisementFormulaBar
        axes={axes}
        reference={active ? referenceOf({ axes, ids: active }) : 'Aucune cellule'}
        cellule={activeCellule}
        resolve={resolve}
      />

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 min-w-56 border-r border-b border-border-strong bg-surface-muted px-3 py-2 text-left text-xs font-semibold text-text-muted">
                {rowsAxe.nom} ↓{columnsAxe ? ` · ${columnsAxe.nom} →` : ''}
              </th>
              {columns.map((column) => (
                <th
                  key={column?.id ?? 'valeur'}
                  className={clsxm(
                    'sticky top-0 z-20 min-w-32 border-r border-b border-border-strong px-3 py-2 text-right align-bottom text-xs whitespace-nowrap text-text',
                    EMPHASIS_CLASS[emphasisOf(column?.kind)],
                  )}
                >
                  {column && columnsAxe ? (
                    <NodeHeader
                      node={column}
                      isCollapsed={collapsedOf(columnsAxe).has(column.id)}
                      onToggle={() => toggleNode({ axe: columnsAxe, id: column.id })}
                      align="right"
                    />
                  ) : (
                    'Valeur'
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th
                  className={clsxm(
                    'sticky left-0 z-10 max-w-md border-r border-b border-r-border-strong border-b-border px-2 py-1 text-left text-sm',
                    EMPHASIS_CLASS[emphasisOf(row.kind)],
                  )}
                >
                  <div style={{ paddingLeft: row.niveau * ROW_INDENT }}>
                    <NodeHeader
                      node={row}
                      isCollapsed={collapsedOf(rowsAxe).has(row.id)}
                      onToggle={() => toggleNode({ axe: rowsAxe, id: row.id })}
                    />
                  </div>
                </th>
                {columns.map((column) => {
                  const ids = idsOf({ row: row.id, column: column?.id })
                  const key = celluleKey(ids)
                  return (
                    <Cell
                      key={key}
                      cellule={resolve(ids)}
                      emphasis={strongerEmphasis({
                        first: emphasisOf(row.kind),
                        second: emphasisOf(column?.kind),
                      })}
                      saisie={saisies[key] ?? ''}
                      tone={toneOf({ key, activeKey, precedents })}
                      label={referenceOf({ axes, ids })}
                      onActivate={() => setActive(ids)}
                      onSaisie={(value) => setSaisies((current) => ({ ...current, [key]: value }))}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="m-0 border-t border-border px-6 py-2 text-xs text-text-muted">
        <b>Case blanche</b> : saisie (une feuille sur chaque axe). <b>Case teintée</b> : calculée,
        plus foncée pour « Tous ». Une case blanche vide (·) est une combinaison jamais saisie :
        elle sort du calcul (ni 0, ni manquante). Avec une moyenne, ces trous font dépendre « Tous »
        de l’ordre des axes : changez l’ordre dans le formulaire pour le voir.
      </p>
    </div>
  )
}

const NO_AXE = ''

function AxeSelect({
  label,
  axes,
  value,
  allowNone = false,
  onChange,
}: {
  label: string
  axes: ReadonlyArray<AxeCroise>
  value: number | null
  allowNone?: boolean
  onChange: (index: number | null) => void
}) {
  const options = axes.map((axe, index) => ({
    value: String(index),
    label: `Axe ${index + 1} · ${axe.nom}`,
  }))
  return (
    <div className="w-56">
      <FieldSelect
        label={label}
        value={value === null ? NO_AXE : String(value)}
        onValueChange={(next) => onChange(next === NO_AXE ? null : Number(next))}
        options={allowNone ? [{ value: NO_AXE, label: 'Aucun axe' }, ...options] : options}
      />
    </div>
  )
}

function NodeHeader({
  node,
  isCollapsed,
  onToggle,
  align = 'left',
}: {
  node: ArbreNode
  isCollapsed: boolean
  onToggle: () => void
  align?: 'left' | 'right'
}) {
  const canToggle = node.kind !== 'feuille' && node.children.length > 0
  return (
    <span
      className={clsxm('flex items-center gap-1.5', align === 'right' && 'justify-end')}
      title={node.id === TOUS_ID ? undefined : node.id}
    >
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
      ) : null}
      <KindMarker kind={node.kind} />
      <span className="truncate">{node.nom}</span>
    </span>
  )
}

function Cell({
  cellule,
  emphasis,
  saisie,
  tone,
  label,
  onActivate,
  onSaisie,
}: {
  cellule: CelluleCroisee
  emphasis: Emphasis
  saisie: string
  tone: Tone | undefined
  label: string
  onActivate: () => void
  onSaisie: (value: string) => void
}) {
  const isIncomplete = cellule.present < cellule.expected
  // Une case calculée reste teintée même entre deux feuilles : un axe fixé sur une parente.
  const cellEmphasis = cellule.isSaisissable
    ? emphasis
    : strongerEmphasis({ first: emphasis, second: 1 })
  return (
    <td
      className={clsxm(
        'h-8 min-w-32 border-r border-b border-border p-0 text-right tabular-nums',
        EMPHASIS_CLASS[cellEmphasis],
        cellule.statut === 'absente' && 'font-normal text-text-subtle',
        tone && TONE_CLASS[tone],
      )}
    >
      {cellule.isSaisissable ? (
        <input
          value={saisie}
          onFocus={onActivate}
          onChange={(event) => onSaisie(event.target.value)}
          placeholder="·"
          inputMode="decimal"
          aria-label={label}
          className="h-full w-full bg-transparent px-3 text-right tabular-nums outline-none placeholder:text-text-subtle"
        />
      ) : (
        <button
          type="button"
          onClick={onActivate}
          className="flex h-full w-full items-center justify-end gap-1 px-3"
        >
          {isIncomplete ? (
            <span className="text-[10px] font-normal text-warning-425">
              {cellule.present}/{cellule.expected}
            </span>
          ) : null}
          {cellule.value === null ? '·' : formatValue(cellule.value)}
        </button>
      )}
    </td>
  )
}
