import { type AxeApiModel } from '@pilote/kpilote-shared/axe'
import { type DeclarationAxeIndicateur } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQueries } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Dices, Eraser, X } from 'lucide-react'
import { type ReactNode, Suspense, useMemo, useState } from 'react'

import { Button } from '@pilote/kpilote-ui/Button'
import { Dialog } from '@pilote/kpilote-ui/Dialog'
import {
  type Arbre,
  type ArbreNode,
  buildArbre,
  depthFirst,
  fonctionLabel,
  formatValue,
  type Kind,
  nommerTous,
  TOUS_ID,
} from '@/lib/axeArbre'
import {
  type AxeCroise,
  buildCroisement,
  buildExempleCroise,
  type CelluleCroisee,
  type CelluleIds,
  celluleKey,
} from '@/lib/axesCroises'
import { clsxm } from '@/lib/clsxm'
import { axeModalitesQueryOptions } from '@/queries/axes'

const AUTO_COLLAPSE_AT = 40

const KIND_DOT: Record<Kind, string> = {
  feuille: 'bg-success-425',
  parente: 'bg-primary',
  tous: 'bg-text',
}

export function AxesCroisesModale({
  open,
  onClose,
  declarations,
  axes,
}: {
  open: boolean
  onClose: () => void
  declarations: ReadonlyArray<DeclarationAxeIndicateur>
  axes: ReadonlyArray<AxeApiModel>
}) {
  return (
    <Dialog open={open} onOpenChange={(ouvert: boolean) => (ouvert ? undefined : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="top-4 h-[calc(100dvh-2rem)] max-h-none w-[calc(100vw-2rem)]">
          <Suspense
            fallback={<p className="p-6 text-sm text-text-muted">Chargement des modalités…</p>}
          >
            <AxesCroises declarations={declarations} axes={axes} onClose={onClose} />
          </Suspense>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

function AxesCroises({
  declarations,
  axes,
  onClose,
}: {
  declarations: ReadonlyArray<DeclarationAxeIndicateur>
  axes: ReadonlyArray<AxeApiModel>
  onClose: () => void
}) {
  const modalitesParAxe = useSuspenseQueries({
    queries: declarations.map((declaration) => axeModalitesQueryOptions(declaration.id)),
  })
  const axesCroises = useMemo(
    () =>
      declarations.map((declaration, index): AxeCroise => {
        const nom = axes.find((axe) => axe.id === declaration.id)?.nom ?? declaration.id
        return {
          id: declaration.id,
          nom,
          fonction: declaration.fonction,
          arbre: nommerTous({
            arbre: buildArbre(modalitesParAxe[index]?.data ?? []),
            axeNom: nom,
          }),
        }
      }),
    [declarations, axes, modalitesParAxe],
  )
  const ordre = declarations.map((declaration) => declaration.id).join(',')

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border px-6 py-3">
        <div className="mr-auto">
          <Dialog.Title>Calcul croisé des axes</Dialog.Title>
          <Dialog.Description className="text-xs">
            Un exemple de valeurs pour un individu : on saisit sur une feuille de chaque axe, le
            reste se calcule axe par axe, dans l’ordre de déclaration.
          </Dialog.Description>
        </div>
        <OrdreAxes axes={axesCroises} />
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="rounded-md p-1.5 text-text-subtle hover:bg-surface-muted hover:text-text"
        >
          <X className="size-[18px]" />
        </button>
      </header>
      <TableauCroise key={ordre} axes={axesCroises} />
    </div>
  )
}

function OrdreAxes({ axes }: { axes: ReadonlyArray<AxeCroise> }) {
  return (
    <ol className="m-0 flex flex-wrap items-center gap-1.5 p-0 text-xs">
      {axes.map((axe, index) => (
        <li key={axe.id} className="flex items-center gap-1.5">
          {index > 0 ? <span className="text-text-subtle">puis</span> : null}
          <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5">
            <b>
              {index + 1}. {axe.nom}
            </b>{' '}
            <span className="text-text-muted">({fonctionLabel(axe.fonction)})</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

const initialCollapsed = (arbre: Arbre | undefined) => {
  if (!arbre || arbre.size - 1 <= AUTO_COLLAPSE_AT) return new Set<string>()
  const racines = arbre.get(TOUS_ID)?.children ?? []
  return new Set(racines.filter((id) => arbre.get(id)?.kind === 'parente'))
}

const toggle = (current: ReadonlySet<string>, id: string) => {
  const next = new Set(current)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

const rowsOf = ({
  arbre,
  collapsed,
}: {
  arbre: Arbre | undefined
  collapsed: ReadonlySet<string>
}) => (arbre ? depthFirst({ arbre, id: TOUS_ID, isOpen: (id) => !collapsed.has(id) }) : [])

function TableauCroise({ axes }: { axes: ReadonlyArray<AxeCroise> }) {
  const [seed, setSeed] = useState(1)
  const [saisies, setSaisies] = useState(() => buildExempleCroise({ axes }))
  const [rowsCollapsed, setRowsCollapsed] = useState(() => initialCollapsed(axes[0]?.arbre))
  const [colsCollapsed, setColsCollapsed] = useState(() => initialCollapsed(axes[1]?.arbre))
  const [tranches, setTranches] = useState<ReadonlyArray<string>>(() => axes.map(() => TOUS_ID))
  const [active, setActive] = useState<CelluleIds | null>(null)

  const resolve = useMemo(() => buildCroisement({ axes, saisies }), [axes, saisies])
  const axeLignes = axes[0]
  const axeColonnes = axes[1]
  const rows = rowsOf({ arbre: axeLignes?.arbre, collapsed: rowsCollapsed })
  const cols = axeColonnes ? rowsOf({ arbre: axeColonnes.arbre, collapsed: colsCollapsed }) : []

  const idsOf = ({ row, col }: { row: string; col: string | undefined }): CelluleIds =>
    axes.map((_, index) => {
      if (index === 0) return row
      if (index === 1) return col ?? TOUS_ID
      return tranches[index] ?? TOUS_ID
    })

  const activeCellule = active ? resolve(active) : null
  const precedents = new Set((activeCellule?.enfants ?? []).map(celluleKey))
  const activeKey = active ? celluleKey(active) : null

  if (!axeLignes) {
    return <p className="p-6 text-sm text-text-muted">Déclarez au moins un axe.</p>
  }

  const colonnes: ReadonlyArray<ArbreNode | undefined> = axeColonnes ? cols : [undefined]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-2">
        {axes.slice(2).map((axe, offset) => (
          <TrancheSelect
            key={axe.id}
            axe={axe}
            value={tranches[offset + 2] ?? TOUS_ID}
            onChange={(id) =>
              setTranches((current) =>
                current.map((tranche, index) => (index === offset + 2 ? id : tranche)),
              )
            }
          />
        ))}
        <span className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="tertiary"
            title="Un autre exemple"
            onClick={() => {
              setSeed(seed + 1)
              setSaisies(buildExempleCroise({ axes, seed: seed + 1 }))
            }}
          >
            <Dices />
          </Button>
          <Button size="sm" variant="tertiary" title="Vider" onClick={() => setSaisies({})}>
            <Eraser />
          </Button>
        </span>
      </div>

      <BarreFormule axes={axes} active={active} cellule={activeCellule} resolve={resolve} />

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 min-w-64 border-r border-b border-border bg-surface-muted px-3 py-2 text-left text-xs font-semibold text-text-muted">
                {axeLignes.nom} ↓{axeColonnes ? ` · ${axeColonnes.nom} →` : ''}
              </th>
              {colonnes.map((col) => (
                <th
                  key={col?.id ?? 'valeur'}
                  className={clsxm(
                    'sticky top-0 z-20 w-28 border-r border-b border-border bg-surface-muted px-2 py-2 text-right align-bottom text-xs font-semibold whitespace-nowrap text-text',
                    col?.kind === 'feuille' && 'font-normal',
                  )}
                >
                  {col ? (
                    <EnteteNode
                      node={col}
                      isCollapsed={colsCollapsed.has(col.id)}
                      onToggle={() => setColsCollapsed((current) => toggle(current, col.id))}
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
                    'sticky left-0 z-10 border-r border-b border-border px-2 py-1 text-left text-sm',
                    row.kind === 'tous' ? 'bg-surface-tinted' : 'bg-surface',
                    row.kind === 'feuille' ? 'font-normal' : 'font-semibold',
                  )}
                >
                  <div style={{ paddingLeft: row.niveau * 16 }}>
                    <EnteteNode
                      node={row}
                      isCollapsed={rowsCollapsed.has(row.id)}
                      onToggle={() => setRowsCollapsed((current) => toggle(current, row.id))}
                    />
                  </div>
                </th>
                {colonnes.map((col) => {
                  const ids = idsOf({ row: row.id, col: col?.id })
                  const key = celluleKey(ids)
                  return (
                    <Case
                      key={key}
                      cellule={resolve(ids)}
                      saisie={saisies[key] ?? ''}
                      tone={toneOf({ key, activeKey, precedents })}
                      label={ids.join(' × ')}
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
        Case vide (·) : combinaison jamais saisie, elle sort du calcul (ni 0, ni manquante). Avec
        une moyenne, ces trous font dépendre « Tous » de l’ordre des axes : changez l’ordre dans le
        formulaire pour le voir.
      </p>
    </div>
  )
}

type Tone = 'active' | 'precedent' | undefined

const toneOf = ({
  key,
  activeKey,
  precedents,
}: {
  key: string
  activeKey: string | null
  precedents: ReadonlySet<string>
}): Tone => {
  if (key === activeKey) return 'active'
  if (precedents.has(key)) return 'precedent'
  return undefined
}

function EnteteNode({
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
      <span className={clsxm('size-2 shrink-0 rounded-full', KIND_DOT[node.kind])} />
      <span className="truncate">{node.nom}</span>
    </span>
  )
}

const TONE_CLASS: Record<Exclude<Tone, undefined>, string> = {
  active: 'relative z-10 outline-2 -outline-offset-2 outline-primary',
  precedent: 'bg-primary-tinted',
}

function Case({
  cellule,
  saisie,
  tone,
  label,
  onActivate,
  onSaisie,
}: {
  cellule: CelluleCroisee
  saisie: string
  tone: Tone
  label: string
  onActivate: () => void
  onSaisie: (value: string) => void
}) {
  const isSaisissable = cellule.axeDescendu === null
  const isAbsente = cellule.statut === 'absente'
  const incomplete = cellule.present < cellule.expected
  return (
    <td
      className={clsxm(
        'h-8 w-28 border-r border-b border-border p-0 text-right tabular-nums',
        isAbsente ? 'bg-surface-muted text-text-subtle' : 'bg-surface',
        !isSaisissable && !isAbsente && 'font-semibold',
        tone && TONE_CLASS[tone],
      )}
    >
      {isSaisissable ? (
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
          {incomplete ? (
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

function TrancheSelect({
  axe,
  value,
  onChange,
}: {
  axe: AxeCroise
  value: string
  onChange: (id: string) => void
}) {
  const options = depthFirst({ arbre: axe.arbre, id: TOUS_ID, isOpen: () => true })
  return (
    <label className="flex items-center gap-2 text-xs text-text-muted">
      <span className="font-semibold text-text">{axe.nom}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text focus:border-primary focus:outline-none"
      >
        {options.map((node) => (
          <option key={node.id} value={node.id}>
            {`${'  '.repeat(node.niveau)}${node.nom}`}
          </option>
        ))}
      </select>
    </label>
  )
}

const nomOf = ({ axe, id }: { axe: AxeCroise | undefined; id: string | undefined }) =>
  axe?.arbre.get(id ?? '')?.nom ?? id ?? ''

function BarreFormule({
  axes,
  active,
  cellule,
  resolve,
}: {
  axes: ReadonlyArray<AxeCroise>
  active: CelluleIds | null
  cellule: CelluleCroisee | null
  resolve: (ids: CelluleIds) => CelluleCroisee
}) {
  const reference = active
    ? active.map((id, index) => nomOf({ axe: axes[index], id })).join(' × ')
    : 'Aucune cellule'
  return (
    <div className="flex min-h-12 items-stretch border-b border-border bg-surface text-sm">
      <div className="flex w-72 shrink-0 items-center border-r border-border px-3 text-xs font-medium text-text-muted">
        {reference}
      </div>
      <div className="flex shrink-0 items-center border-r border-border px-3 font-serif text-text-subtle italic">
        fx
      </div>
      <div className="flex min-w-0 flex-1 items-center px-3 py-2 text-text">
        <Explication axes={axes} cellule={cellule} resolve={resolve} />
      </div>
    </div>
  )
}

function Explication({
  axes,
  cellule,
  resolve,
}: {
  axes: ReadonlyArray<AxeCroise>
  cellule: CelluleCroisee | null
  resolve: (ids: CelluleIds) => CelluleCroisee
}): ReactNode {
  if (!cellule) {
    return (
      <span className="text-text-muted">
        Cliquez sur une cellule pour voir comment le moteur la calcule : ses sources s’allument en
        bleu.
      </span>
    )
  }
  if (cellule.axeDescendu === null) {
    if (cellule.statut === 'absente') {
      return (
        <span className="text-text-muted">
          Combinaison jamais saisie : elle n’existe pas pour cet individu.
        </span>
      )
    }
    return <span>Saisie, sur une feuille de chaque axe : rien ne la calcule.</span>
  }
  const axe = axes[cellule.axeDescendu]
  const index = cellule.axeDescendu
  const enfants = cellule.enfants.map((ids) => ({
    nom: nomOf({ axe, id: ids[index] }),
    cellule: resolve(ids),
  }))
  const comptes = enfants.filter((enfant) => enfant.cellule.value !== null)
  const ignores = enfants.filter((enfant) => enfant.cellule.statut === 'absente')
  const separateur = axe?.fonction === 'AVG' ? ', ' : ' + '
  const termes = comptes
    .map((enfant) => `${enfant.nom} ${formatValue(enfant.cellule.value ?? 0)}`)
    .join(separateur)
  const formule = axe?.fonction === 'AVG' ? `moyenne(${termes})` : termes
  return (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="text-xs text-text-muted">
        On descend <b className="text-text">{axe?.nom}</b> (axe {index + 1}, le dernier déclaré
        encore à préciser), en {axe ? fonctionLabel(axe.fonction) : ''} :
      </span>
      <span className="font-mono text-xs">
        = {formule || '∅'}
        {cellule.value === null ? null : (
          <strong className="text-sm"> = {formatValue(cellule.value)}</strong>
        )}
      </span>
      {ignores.length > 0 ? (
        <span className="text-xs text-text-subtle">
          ignorée{ignores.length > 1 ? 's' : ''} (jamais saisie{ignores.length > 1 ? 's' : ''}) :{' '}
          {ignores.map((enfant) => enfant.nom).join(', ')}
        </span>
      ) : null}
    </span>
  )
}
