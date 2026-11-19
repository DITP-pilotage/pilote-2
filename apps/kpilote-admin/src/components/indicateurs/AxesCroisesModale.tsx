import { type AxeApiModel } from '@pilote/kpilote-shared/axe'
import { type DeclarationAxeIndicateur } from '@pilote/kpilote-shared/indicateur'
import { useSuspenseQueries } from '@tanstack/react-query'
import { AlertTriangle, ChevronDown, ChevronRight, Dices, Eraser, Grid3x3, X } from 'lucide-react'
import { type ReactNode, Suspense, useId, useMemo, useState } from 'react'

import { Button } from '@pilote/kpilote-ui/Button'
import { Dialog } from '@pilote/kpilote-ui/Dialog'
import { Field } from '@pilote/kpilote-ui/Field'
import { FieldSelect } from '@pilote/kpilote-ui/FieldSelect'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pilote/kpilote-ui/Select'
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

const firstFeuilleOf = (arbre: Arbre) =>
  depthFirst({ arbre, id: TOUS_ID, isOpen: () => true }).find((node) => node.kind === 'feuille')?.id

const countFeuilles = (arbre: Arbre) =>
  [...arbre.values()].filter((node) => node.kind === 'feuille').length

type Disposition = { lignes: number; colonnes: number | null }

// Choisir comme lignes l'axe déjà en colonnes (ou l'inverse) échange les deux.
const withLignes = ({ disposition, index }: { disposition: Disposition; index: number }) => {
  if (index === disposition.colonnes) return { lignes: index, colonnes: disposition.lignes }
  return { ...disposition, lignes: index }
}

const withColonnes = ({
  disposition,
  index,
}: {
  disposition: Disposition
  index: number | null
}) => {
  if (index === disposition.lignes)
    return { lignes: disposition.colonnes ?? index, colonnes: index }
  return { ...disposition, colonnes: index }
}

function TableauCroise({ axes }: { axes: ReadonlyArray<AxeCroise> }) {
  const [seed, setSeed] = useState(1)
  const [saisies, setSaisies] = useState(() => buildExempleCroise({ axes }))
  const [disposition, setDisposition] = useState<Disposition>({
    lignes: 0,
    colonnes: axes.length > 1 ? 1 : null,
  })
  const [collapsedByAxe, setCollapsedByAxe] = useState<Record<string, ReadonlySet<string>>>(() =>
    Object.fromEntries(axes.map((axe) => [axe.id, initialCollapsed(axe.arbre)])),
  )
  // Un axe fixé part sur sa première feuille : les cases feuille × feuille sont saisissables.
  const [tranches, setTranches] = useState<ReadonlyArray<string>>(() =>
    axes.map((axe) => firstFeuilleOf(axe.arbre) ?? TOUS_ID),
  )
  const [active, setActive] = useState<CelluleIds | null>(null)

  const resolve = useMemo(() => buildCroisement({ axes, saisies }), [axes, saisies])
  const randomize = (complet: boolean) => {
    setSeed(seed + 1)
    setSaisies(buildExempleCroise({ axes, seed: seed + 1, complet }))
  }
  const axeLignes = axes[disposition.lignes]
  const axeColonnes = disposition.colonnes === null ? undefined : axes[disposition.colonnes]
  const collapsedOf = (axe: AxeCroise | undefined) =>
    (axe ? collapsedByAxe[axe.id] : undefined) ?? new Set<string>()
  const toggleNode = ({ axe, id }: { axe: AxeCroise; id: string }) =>
    setCollapsedByAxe((current) => ({
      ...current,
      [axe.id]: toggle(current[axe.id] ?? new Set(), id),
    }))
  const rows = rowsOf({ arbre: axeLignes?.arbre, collapsed: collapsedOf(axeLignes) })
  const cols = axeColonnes
    ? rowsOf({ arbre: axeColonnes.arbre, collapsed: collapsedOf(axeColonnes) })
    : []

  const idsOf = ({ row, col }: { row: string; col: string | undefined }): CelluleIds =>
    axes.map((_, index) => {
      if (index === disposition.lignes) return row
      if (index === disposition.colonnes) return col ?? TOUS_ID
      return tranches[index] ?? TOUS_ID
    })

  const activeCellule = active ? resolve(active) : null
  const precedents = new Set((activeCellule?.enfants ?? []).map(celluleKey))
  const activeKey = active ? celluleKey(active) : null

  if (!axeLignes) {
    return <p className="p-6 text-sm text-text-muted">Déclarez au moins un axe.</p>
  }

  const colonnes: ReadonlyArray<ArbreNode | undefined> = axeColonnes ? cols : [undefined]
  const fixes = axes
    .map((axe, index) => ({ axe, index }))
    .filter(({ index }) => index !== disposition.lignes && index !== disposition.colonnes)
  const alertes = axes.flatMap((axe, index) => {
    const feuilles = countFeuilles(axe.arbre)
    if (feuilles === 0)
      return [`L’axe ${index + 1} « ${axe.nom} » n’a aucune modalité : rien à saisir.`]
    if (feuilles === 1) {
      return [
        `L’axe ${index + 1} « ${axe.nom} » n’a qu’une modalité feuille : le découper ne change aucune valeur, « Tous » vaut cette modalité.`,
      ]
    }
    return []
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-border px-6 py-3">
        <AxeSelect
          label="Lignes"
          axes={axes}
          value={disposition.lignes}
          onChange={(index) => {
            if (index === null) return
            setDisposition(withLignes({ disposition, index }))
            setActive(null)
          }}
        />
        {axes.length > 1 ? (
          <AxeSelect
            label="Colonnes"
            axes={axes}
            value={disposition.colonnes}
            allowNone
            onChange={(index) => {
              setDisposition(withColonnes({ disposition, index }))
              setActive(null)
            }}
          />
        ) : null}
        {fixes.map(({ axe, index }) => (
          <TrancheSelect
            key={axe.id}
            axe={axe}
            index={index}
            value={tranches[index] ?? TOUS_ID}
            onChange={(id) => {
              setActive(null)
              setTranches((current) =>
                current.map((tranche, position) => (position === index ? id : tranche)),
              )
            }}
          />
        ))}
        <span className="ml-auto flex items-center gap-1 self-center">
          <Button
            size="sm"
            variant="tertiary"
            title="Valeurs au hasard, avec des cases vides"
            onClick={() => randomize(false)}
          >
            <Dices />
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            title="Valeurs au hasard, sans case vide"
            onClick={() => randomize(true)}
          >
            <Grid3x3 />
          </Button>
          <Button size="sm" variant="tertiary" title="Vider" onClick={() => setSaisies({})}>
            <Eraser />
          </Button>
        </span>
      </div>

      {alertes.length > 0 ? (
        <ul className="m-0 flex flex-col gap-1 border-b border-border bg-warning-tinted px-6 py-2 text-xs text-warning">
          {alertes.map((alerte) => (
            <li key={alerte} className="flex items-center gap-2">
              <AlertTriangle className="size-3.5 shrink-0" />
              {alerte}
            </li>
          ))}
        </ul>
      ) : null}

      <BarreFormule axes={axes} active={active} cellule={activeCellule} resolve={resolve} />

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-30 min-w-56 border-r border-b border-border-strong bg-surface-muted px-3 py-2 text-left text-xs font-semibold text-text-muted">
                {axeLignes.nom} ↓{axeColonnes ? ` · ${axeColonnes.nom} →` : ''}
              </th>
              {colonnes.map((col) => (
                <th
                  key={col?.id ?? 'valeur'}
                  className={clsxm(
                    'sticky top-0 z-20 min-w-32 border-r border-b border-border-strong px-3 py-2 text-right align-bottom text-xs whitespace-nowrap text-text',
                    EMPHASE_HEADER[emphaseOf(col?.kind)],
                  )}
                >
                  {col && axeColonnes ? (
                    <EnteteNode
                      node={col}
                      isCollapsed={collapsedOf(axeColonnes).has(col.id)}
                      onToggle={() => toggleNode({ axe: axeColonnes, id: col.id })}
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
                    EMPHASE_HEADER[emphaseOf(row.kind)],
                  )}
                >
                  <div style={{ paddingLeft: row.niveau * 16 }}>
                    <EnteteNode
                      node={row}
                      isCollapsed={collapsedOf(axeLignes).has(row.id)}
                      onToggle={() => toggleNode({ axe: axeLignes, id: row.id })}
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
                      emphase={Math.max(emphaseOf(row.kind), emphaseOf(col?.kind))}
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

const AUCUN_AXE = ''

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
        value={value === null ? AUCUN_AXE : String(value)}
        onValueChange={(next) => onChange(next === AUCUN_AXE ? null : Number(next))}
        options={allowNone ? [{ value: AUCUN_AXE, label: 'Aucun axe' }, ...options] : options}
      />
    </div>
  )
}

const referenceOf = ({ axes, ids }: { axes: ReadonlyArray<AxeCroise>; ids: CelluleIds }) =>
  ids
    .map((id, index) => {
      const axe = axes[index]
      const nom = axe?.arbre.get(id)?.nom ?? id
      return id === TOUS_ID ? nom : `${axe?.nom ?? ''} : ${nom}`
    })
    .join(' × ')

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

// 0 : croise deux feuilles ; 1 : une parente ; 2 : « Tous ». Une case blanche se saisit, une
// case teintée se calcule, plus foncée pour la marginale.
type Emphase = number

const emphaseOf = (kind: Kind | undefined): Emphase => {
  if (kind === 'tous') return 2
  if (kind === 'parente') return 1
  return 0
}

const EMPHASE_HEADER: Record<Emphase, string> = {
  0: 'bg-surface font-normal',
  1: 'bg-surface-muted font-semibold',
  2: 'bg-surface-tinted font-bold',
}

const EMPHASE_CELL: Record<Emphase, string> = {
  0: 'bg-surface',
  1: 'bg-surface-muted font-semibold',
  2: 'bg-surface-tinted font-bold',
}

function Case({
  cellule,
  emphase,
  saisie,
  tone,
  label,
  onActivate,
  onSaisie,
}: {
  cellule: CelluleCroisee
  emphase: Emphase
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
        'h-8 min-w-32 border-r border-b border-border p-0 text-right tabular-nums',
        EMPHASE_CELL[isSaisissable ? emphase : Math.max(emphase, 1)],
        isAbsente && 'font-normal text-text-subtle',
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
  index,
  value,
  onChange,
}: {
  axe: AxeCroise
  index: number
  value: string
  onChange: (id: string) => void
}) {
  const labelId = useId()
  const options = depthFirst({ arbre: axe.arbre, id: TOUS_ID, isOpen: () => true })
  const node = axe.arbre.get(value)
  const effet =
    node && node.children.length > 0
      ? `Chaque case fait la ${fonctionLabel(axe.fonction)} de ses ${node.children.length} modalité${node.children.length > 1 ? 's' : ''}.`
      : 'Une feuille : les cases du tableau deviennent saisissables.'
  return (
    <div className="flex w-72 flex-col gap-1">
      <Field label={`Fixé · Axe ${index + 1} · ${axe.nom}`} labelId={labelId}>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger aria-labelledby={labelId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* Comme ModaliteSelect (webapp) : le retrait est posé sur la ligne, pas sur son
                texte, que Radix recopie dans le bouton. */}
            {options.map((option) => (
              <SelectItem
                key={option.id}
                value={option.id}
                className={clsxm(option.kind !== 'feuille' && 'font-semibold')}
                style={{ paddingLeft: `${0.625 + option.niveau * 0.875}rem` }}
              >
                {option.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <span className="text-[11px] text-text-subtle">{effet}</span>
    </div>
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
  const reference = active ? referenceOf({ axes, ids: active }) : 'Aucune cellule'
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
