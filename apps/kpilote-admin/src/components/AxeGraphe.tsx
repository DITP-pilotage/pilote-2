import {
  type AxeApiModel,
  type ModaliteApiModel,
  modalitePublicIdSchema,
  type NiveauAxeApiModel,
} from '@pilote/kpilote-shared/axe'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Dices,
  Eraser,
  Info,
  MousePointerClick,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { deleteModalite, upsertAxe, upsertModalite } from '@/api/axes'
import { Button } from '@pilote/kpilote-ui/Button'
import { Dialog } from '@pilote/kpilote-ui/Dialog'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { extractApiError } from '@/lib/apiError'
import { clsxm } from '@/lib/clsxm'

const NODE_H = 52
const ROW_H = 64
const LANE_PAD = 16
const HEADER_H = 64
const MIN_COL_GAP = 48
const MAX_NODE_W = 240
const MIN_NODE_W = 150
const TOUS_ID = '__TOUS__'
const CHILD_LIMIT = 25
const AUTO_COLLAPSE_AT = 60
const ALERTES_LIMIT = 5

type Mode = 'edition' | 'simulation'
type Fonction = 'SUM' | 'AVG'
type Kind = 'feuille' | 'parente' | 'tous'

type LayoutNode = {
  id: string
  nom: string
  kind: Kind
  niveau: number
  parent: string | null
  children: string[]
}

type PlacedNode = LayoutNode & { x: number; y: number; hidden: number }

type MoreNode = { parent: string; x: number; y: number; count: number }

type Selection =
  | { type: 'node'; id: string }
  | { type: 'niveau'; ordre: number }
  | { type: 'ajout'; parent: string | null }
  | null

type Computed = { value: number | null; present: number; expected: number }

const buildTree = (modalites: ReadonlyArray<ModaliteApiModel>) => {
  const byParent = new Map<string | null, string[]>()
  for (const m of modalites) {
    byParent.set(m.parent, [...(byParent.get(m.parent) ?? []), m.id])
  }
  const tree = new Map<string, LayoutNode>()
  for (const m of modalites) {
    const children = byParent.get(m.id) ?? []
    tree.set(m.id, {
      id: m.id,
      nom: m.nom,
      kind: children.length === 0 ? 'feuille' : 'parente',
      niveau: m.niveau,
      parent: m.parent ?? TOUS_ID,
      children,
    })
  }
  tree.set(TOUS_ID, {
    id: TOUS_ID,
    nom: 'Tous',
    kind: 'tous',
    niveau: 0,
    parent: null,
    children: byParent.get(null) ?? [],
  })
  return tree
}

const countDescendants = (tree: Map<string, LayoutNode>, id: string): number =>
  (tree.get(id)?.children ?? []).reduce((total, c) => total + 1 + countDescendants(tree, c), 0)

// Au-delà de quelques dizaines de modalités, on part replié au premier niveau.
const initialCollapsed = (tree: Map<string, LayoutNode>) =>
  new Set(
    tree.size - 1 > AUTO_COLLAPSE_AT
      ? (tree.get(TOUS_ID)?.children ?? []).filter((id) => tree.get(id)?.kind === 'parente')
      : [],
  )

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const buildLayout = ({
  tree,
  depth,
  availableWidth,
  collapsed,
  showAll,
  visible,
}: {
  tree: Map<string, LayoutNode>
  depth: number
  availableWidth: number
  collapsed: ReadonlySet<string>
  showAll: ReadonlySet<string>
  visible: ReadonlySet<string> | null
}) => {
  const cols = depth + 1
  const laneW = Math.max(MIN_NODE_W + MIN_COL_GAP, availableWidth / cols)
  const nodeW = Math.max(MIN_NODE_W, Math.min(MAX_NODE_W, laneW - MIN_COL_GAP))
  const laneX = (col: number) => col * laneW
  const nodeX = (col: number) => laneX(col) + (laneW - nodeW) / 2
  const colOf = (niveau: number) => (niveau === 0 ? depth : depth - niveau)
  const placed = new Map<string, PlacedNode>()
  const extras: MoreNode[] = []
  let row = 0
  const nextRow = () => HEADER_H + LANE_PAD + row++ * ROW_H

  const place = (id: string): number => {
    const node = tree.get(id)!
    const isCollapsed = !visible && collapsed.has(id)
    const children = isCollapsed
      ? []
      : visible
        ? node.children.filter((c) => visible.has(c))
        : node.children
    const limited = !visible && !showAll.has(id) && children.length > CHILD_LIMIT
    const shown = limited ? children.slice(0, CHILD_LIMIT) : children
    const ys = shown.map(place)
    if (limited) {
      const y = nextRow()
      extras.push({
        parent: id,
        x: nodeX(colOf(node.niveau + 1)),
        y,
        count: children.length - CHILD_LIMIT,
      })
      ys.push(y)
    }
    const y = ys.length === 0 ? nextRow() : ys.reduce((a, b) => a + b, 0) / ys.length
    placed.set(id, {
      ...node,
      x: nodeX(colOf(node.niveau)),
      y,
      hidden: isCollapsed ? countDescendants(tree, id) : 0,
    })
    return y
  }
  place(TOUS_ID)

  return {
    placed,
    extras,
    laneW,
    nodeW,
    laneX,
    width: laneW * cols,
    height: HEADER_H + LANE_PAD * 2 + Math.max(row, 1) * ROW_H - (ROW_H - NODE_H),
  }
}

const relatedIds = (nodes: Map<string, LayoutNode>, id: string) => {
  const ids = new Set<string>([id])
  const down = (current: string) => {
    for (const child of nodes.get(current)?.children ?? []) {
      ids.add(child)
      down(child)
    }
  }
  down(id)
  let parent = nodes.get(id)?.parent ?? null
  while (parent) {
    ids.add(parent)
    parent = nodes.get(parent)?.parent ?? null
  }
  return ids
}

const ancestorsOf = (nodes: Map<string, LayoutNode>, id: string) => {
  const chain: LayoutNode[] = []
  let parent = nodes.get(id)?.parent ?? null
  while (parent) {
    const node = nodes.get(parent)
    if (!node) break
    chain.push(node)
    parent = node.parent
  }
  return chain
}

const formatValue = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`

const suggestId = (nom: string, parent: string | null) => {
  const slug = nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const prefix = parent && parent !== TOUS_ID ? `${parent.split('-')[0]}-` : ''
  return `${prefix}${slug}`
    .replace(/^[^A-Z]+/, '')
    .slice(0, 20)
    .replace(/-+$/, '')
}

const useWidth = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return { ref, width }
}

const useAxeEdition = (axe: AxeApiModel) => {
  const queryClient = useQueryClient()
  const toast = useToast()
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['axe', axe.id] })
    await queryClient.invalidateQueries({ queryKey: ['axes'] })
  }
  const onError = (error: unknown) => toast({ title: extractApiError(error), variant: 'error' })

  const enregistrerModalite = useMutation({
    mutationFn: (input: { id: string; nom: string; parent: string | null }) =>
      upsertModalite({
        axeId: axe.id,
        id: input.id,
        body: { nom: input.nom.trim(), parent: input.parent },
      }),
    onSuccess: refresh,
    onError,
  })

  const supprimerModalite = useMutation({
    mutationFn: (id: string) => deleteModalite({ axeId: axe.id, id }),
    onSuccess: async () => {
      await refresh()
      toast({ title: 'Modalité supprimée.' })
    },
    onError,
  })

  const enregistrerNiveaux = useMutation({
    mutationFn: (niveaux: ReadonlyArray<string>) =>
      upsertAxe({
        id: axe.id,
        body: {
          nom: axe.nom,
          description: axe.description,
          niveaux: niveaux.map((nom) => ({ nom: nom.trim() })),
        },
      }),
    onSuccess: refresh,
    onError,
  })

  return {
    enregistrerModalite,
    supprimerModalite,
    enregistrerNiveaux,
    pending:
      enregistrerModalite.isPending || supprimerModalite.isPending || enregistrerNiveaux.isPending,
  }
}

type Edition = ReturnType<typeof useAxeEdition>

export function AxeGrapheModale({
  open,
  onClose,
  axe,
  modalites,
  locked,
}: {
  open: boolean
  onClose: () => void
  axe: AxeApiModel
  modalites: ReadonlyArray<ModaliteApiModel>
  locked: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={(ouvert: boolean) => (ouvert ? undefined : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="top-4 h-[calc(100dvh-2rem)] max-h-none w-[calc(100vw-2rem)]">
          <AxeGraphe axe={axe} modalites={modalites} locked={locked} onClose={onClose} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

function AxeGraphe({
  axe,
  modalites,
  locked,
  onClose,
}: {
  axe: AxeApiModel
  modalites: ReadonlyArray<ModaliteApiModel>
  locked: boolean
  onClose: () => void
}) {
  const niveaux = axe.niveaux
  const depth = Math.max(niveaux.length, ...modalites.map((m) => m.niveau))
  const tree = useMemo(() => buildTree(modalites), [modalites])
  const { ref, width: availableWidth } = useWidth()
  const [collapsed, setCollapsed] = useState<Set<string>>(() => initialCollapsed(tree))
  const [showAll, setShowAll] = useState<Set<string>>(() => new Set())
  const [recherche, setRecherche] = useState('')

  const visible = useMemo(() => {
    const query = normalize(recherche.trim())
    if (query === '') return null
    const ids = new Set<string>([TOUS_ID])
    for (const node of tree.values()) {
      if (node.kind === 'tous') continue
      if (!normalize(node.nom).includes(query) && !normalize(node.id).includes(query)) continue
      ids.add(node.id)
      for (const ancestor of ancestorsOf(tree, node.id)) ids.add(ancestor.id)
    }
    return ids
  }, [tree, recherche])
  const nbResultats = visible ? visible.size - 1 : 0

  const { placed, extras, laneW, nodeW, laneX, width, height } = useMemo(
    () => buildLayout({ tree, depth, availableWidth, collapsed, showAll, visible }),
    [tree, depth, availableWidth, collapsed, showAll, visible],
  )
  const edition = useAxeEdition(axe)
  const [hovered, setHovered] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection>(null)
  const [mode, setMode] = useState<Mode>('edition')
  const [fonction, setFonction] = useState<Fonction>('SUM')
  const [saisies, setSaisies] = useState<Record<string, string>>({})
  const simulation = mode === 'simulation'
  const editable = mode === 'edition' && !locked

  const toggleCollapse = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Déplie les ancêtres d'une modalité (et lève la limite d'affichage) pour la rendre visible.
  const reveal = (id: string) => {
    const chain = ancestorsOf(tree, id)
    setCollapsed((current) => new Set([...current].filter((c) => !chain.some((a) => a.id === c))))
    setShowAll((current) => {
      const next = new Set(current)
      let child = id
      for (const ancestor of chain) {
        if (ancestor.children.indexOf(child) >= CHILD_LIMIT) next.add(ancestor.id)
        child = ancestor.id
      }
      return next
    })
  }

  const selectNode = (id: string) => {
    reveal(id)
    setSelection({ type: 'node', id })
  }

  const selectedNodeId =
    selection?.type === 'node'
      ? selection.id
      : selection?.type === 'ajout'
        ? (selection.parent ?? TOUS_ID)
        : null
  const focus = hovered ?? selectedNodeId
  const highlighted = focus
    ? relatedIds(tree, focus)
    : selection?.type === 'niveau'
      ? new Set([...tree.values()].filter((n) => n.niveau === selection.ordre).map((n) => n.id))
      : null

  const computed = useMemo(() => {
    const result = new Map<string, Computed>()
    const compute = (id: string): number | null => {
      const node = tree.get(id)
      if (!node) return null
      if (node.kind === 'feuille') {
        const raw = saisies[id]?.replace(',', '.').trim()
        const value = raw && !Number.isNaN(Number(raw)) ? Number(raw) : null
        result.set(id, { value, present: value === null ? 0 : 1, expected: 1 })
        return value
      }
      const values = node.children.map(compute).filter((v): v is number => v !== null)
      const sum = values.reduce((a, b) => a + b, 0)
      const value = values.length === 0 ? null : fonction === 'SUM' ? sum : sum / values.length
      result.set(id, { value, present: values.length, expected: node.children.length })
      return value
    }
    compute(TOUS_ID)
    return result
  }, [tree, saisies, fonction])

  const feuilles = [...tree.values()].filter((n) => n.kind === 'feuille')
  const parentes = [...tree.values()].filter((n) => n.kind === 'parente')
  const fillRandom = () =>
    setSaisies(
      Object.fromEntries(
        feuilles.map((f) => [
          f.id,
          Math.random() < 0.2 ? '' : String(Math.round(Math.random() * 90 + 10)),
        ]),
      ),
    )

  const niveauxVides = niveaux.filter((n) => !modalites.some((m) => m.niveau === n.ordre))
  const feuillesIntermediaires = feuilles.filter((f) => f.niveau < niveaux.length)
  const parentsUniques = parentes.filter((n) => n.children.length === 1)
  const nbAlertes = niveauxVides.length + feuillesIntermediaires.length + parentsUniques.length

  const nomNiveau = (ordre: number) =>
    niveaux.find((n) => n.ordre === ordre)?.nom ?? `Niveau ${ordre}`

  const canAddChild = (node: LayoutNode) => node.kind === 'tous' || node.niveau < niveaux.length

  const ajouterNiveau = () =>
    edition.enregistrerNiveaux.mutate(
      [...niveaux.map((n) => n.nom), `Niveau ${niveaux.length + 1}`],
      { onSuccess: () => setSelection({ type: 'niveau', ordre: niveaux.length + 1 }) },
    )

  const lanes = Array.from({ length: depth + 1 }, (_, col) => ({
    col,
    ordre: col === depth ? 0 : depth - col,
  }))

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border px-6 py-3">
        <div className="mr-auto">
          <Dialog.Title>Axe {axe.nom}</Dialog.Title>
          <Dialog.Description className="text-xs">
            {pluriel(tree.size - 1, 'modalité')} · les valeurs se saisissent sur les feuilles, à
            gauche, et remontent vers la droite jusqu’à « Tous ».
          </Dialog.Description>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <Legende kind="feuille">Feuille (saisie)</Legende>
          <Legende kind="parente">Parente (calculée)</Legende>
          <Legende kind="tous">Tous</Legende>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            value={mode}
            onChange={(value) => {
              setMode(value)
              if (value === 'simulation' && selection?.type === 'ajout') setSelection(null)
            }}
            options={[
              { value: 'edition', label: locked ? 'Lecture' : 'Modifier' },
              { value: 'simulation', label: 'Simuler' },
            ]}
          />
          {editable ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={edition.pending}
              onClick={ajouterNiveau}
            >
              <Plus /> Niveau
            </Button>
          ) : null}
          {simulation ? (
            <>
              <Segmented
                value={fonction}
                onChange={setFonction}
                options={[
                  { value: 'SUM', label: 'Somme' },
                  { value: 'AVG', label: 'Moyenne' },
                ]}
              />
              <Button size="sm" variant="tertiary" onClick={fillRandom} title="Valeurs au hasard">
                <Dices />
              </Button>
              <Button size="sm" variant="tertiary" onClick={() => setSaisies({})} title="Vider">
                <Eraser />
              </Button>
            </>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="rounded-md p-1.5 text-text-subtle hover:bg-surface-muted hover:text-text"
        >
          <X className="size-[18px]" />
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-6 py-2">
        <label className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-subtle" />
          <input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Rechercher une modalité"
            aria-label="Rechercher une modalité"
            className="w-72 rounded-md border border-border bg-surface py-1.5 pr-2.5 pl-8 text-sm text-text focus:border-primary focus:outline-none"
          />
        </label>
        {visible ? (
          <span className="text-xs text-text-muted">
            {nbResultats === 0
              ? 'Aucune modalité ne correspond.'
              : `${pluriel(nbResultats, 'modalité')} affichée${nbResultats > 1 ? 's' : ''} (résultats et leurs parents)`}
          </span>
        ) : (
          <>
            <Button
              size="sm"
              variant="tertiary"
              disabled={parentes.length === 0}
              onClick={() => setCollapsed(new Set(parentes.map((p) => p.id)))}
            >
              <ChevronsDownUp /> Tout replier
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              disabled={collapsed.size === 0}
              onClick={() => setCollapsed(new Set())}
            >
              <ChevronsUpDown /> Tout déplier
            </Button>
          </>
        )}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div ref={ref} className="min-h-0 overflow-auto bg-surface-muted">
          {availableWidth > 0 ? (
            <div className="relative" style={{ width, height, minHeight: '100%' }}>
              {lanes.map(({ col, ordre }) => {
                const isTous = ordre === 0
                const selected = selection?.type === 'niveau' && selection.ordre === ordre
                return (
                  <div
                    key={col}
                    className={clsxm(
                      'absolute top-0 bottom-0 border-r border-border/70',
                      selected
                        ? 'bg-primary-tinted/40'
                        : col % 2 === 0
                          ? 'bg-surface'
                          : 'bg-surface-muted',
                    )}
                    style={{ left: laneX(col), width: laneW }}
                  >
                    <button
                      type="button"
                      disabled={isTous}
                      onClick={() => setSelection(selected ? null : { type: 'niveau', ordre })}
                      className={clsxm(
                        'sticky top-0 z-10 flex w-full flex-col items-center justify-center border-b border-border/70 bg-inherit text-center',
                        !isTous && 'hover:bg-primary-tinted/40',
                      )}
                      style={{ height: HEADER_H }}
                    >
                      <span className="text-[11px] text-text-subtle">
                        {isTous
                          ? 'Résultat'
                          : `Niveau ${ordre}${ordre === niveaux.length ? ' · le plus fin' : ''}`}
                      </span>
                      <span className="text-sm font-semibold text-text">
                        {isTous ? 'Tous' : nomNiveau(ordre)}
                      </span>
                    </button>
                  </div>
                )
              })}

              <svg
                className="pointer-events-none absolute inset-0"
                width={width}
                height={height}
                aria-hidden
              >
                <defs>
                  {(['off', 'on'] as const).map((state) => (
                    <marker
                      key={state}
                      id={`fleche-${state}`}
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path
                        d="M0,0 L10,5 L0,10 z"
                        className={state === 'on' ? 'fill-primary' : 'fill-border-strong'}
                      />
                    </marker>
                  ))}
                </defs>
                {[...placed.values()]
                  .filter((n) => n.parent && placed.has(n.parent))
                  .map((n) => {
                    const parent = placed.get(n.parent!)!
                    const on = !!(focus && highlighted?.has(n.id) && highlighted.has(parent.id))
                    return (
                      <Lien
                        key={n.id}
                        from={n}
                        to={parent}
                        nodeW={nodeW}
                        on={on}
                        dimmed={!!highlighted && !on}
                      />
                    )
                  })}
                {extras.map((more) => (
                  <Lien
                    key={`more-${more.parent}`}
                    from={more}
                    to={placed.get(more.parent)!}
                    nodeW={nodeW}
                    on={false}
                    dimmed={!!highlighted}
                    dashed
                  />
                ))}
              </svg>

              {[...placed.values()].map((n) => (
                <GraphNode
                  key={n.id}
                  node={n}
                  width={nodeW}
                  selected={selectedNodeId === n.id}
                  dimmed={highlighted ? !highlighted.has(n.id) : false}
                  match={!!visible && n.kind !== 'tous'}
                  simulation={simulation}
                  fonction={fonction}
                  saisie={saisies[n.id] ?? ''}
                  computed={computed.get(n.id)}
                  onHover={setHovered}
                  onSelect={() =>
                    setSelection((s) =>
                      s?.type === 'node' && s.id === n.id ? null : { type: 'node', id: n.id },
                    )
                  }
                  onToggle={
                    !visible && n.kind !== 'feuille' && n.children.length > 0
                      ? () => toggleCollapse(n.id)
                      : undefined
                  }
                  onAddChild={
                    editable && canAddChild(n)
                      ? () => {
                          if (collapsed.has(n.id)) toggleCollapse(n.id)
                          setSelection({ type: 'ajout', parent: n.kind === 'tous' ? null : n.id })
                        }
                      : undefined
                  }
                  onSaisie={(value) => setSaisies((s) => ({ ...s, [n.id]: value }))}
                />
              ))}

              {extras.map((more) => (
                <button
                  key={`more-${more.parent}`}
                  type="button"
                  onClick={() => setShowAll((current) => new Set(current).add(more.parent))}
                  className={clsxm(
                    'absolute flex flex-col items-start justify-center rounded-lg border border-dashed border-border-strong bg-surface/70 px-3 text-left transition-opacity hover:border-primary',
                    highlighted && 'opacity-30',
                  )}
                  style={{ left: more.x, top: more.y, width: nodeW, height: NODE_H }}
                >
                  <span className="text-sm font-medium text-text">
                    + {pluriel(more.count, 'autre modalité')}
                  </span>
                  <span className="text-[11px] text-primary">Tout afficher</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto border-l border-border px-6 py-5">
          {selection === null ? (
            <Glossaire
              axeNom={axe.nom}
              niveaux={niveaux}
              nodes={tree}
              editable={editable}
              vide={modalites.length === 0}
              onAjouterRacine={() => setSelection({ type: 'ajout', parent: null })}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setSelection(null)}
                className="inline-flex items-center gap-1 self-start text-xs font-medium text-primary hover:underline"
              >
                <ArrowLeft className="size-3.5" /> Comment lire ce graphe
              </button>
              {selection.type === 'node' && tree.get(selection.id) ? (
                <DetailModalite
                  key={selection.id}
                  node={tree.get(selection.id)!}
                  nodes={tree}
                  niveaux={niveaux}
                  nomNiveau={nomNiveau}
                  simulation={simulation}
                  fonction={fonction}
                  computed={computed}
                  editable={editable}
                  edition={edition}
                  onSelect={selectNode}
                  onAjouter={(parent) => {
                    if (parent) reveal(parent)
                    setCollapsed((current) => {
                      const next = new Set(current)
                      if (parent) next.delete(parent)
                      return next
                    })
                    setSelection({ type: 'ajout', parent })
                  }}
                  onSupprime={() => setSelection(null)}
                />
              ) : selection.type === 'niveau' ? (
                <DetailNiveau
                  key={selection.ordre}
                  ordre={selection.ordre}
                  niveaux={niveaux}
                  nodes={tree}
                  nomNiveau={nomNiveau}
                  editable={editable}
                  edition={edition}
                  onSelect={selectNode}
                  onAjouter={(parent) => setSelection({ type: 'ajout', parent })}
                  onSupprime={() => setSelection(null)}
                />
              ) : selection.type === 'ajout' ? (
                <FormulaireAjout
                  key={selection.parent ?? TOUS_ID}
                  parent={selection.parent ? (tree.get(selection.parent) ?? null) : null}
                  nomNiveau={nomNiveau}
                  existants={tree}
                  edition={edition}
                  onCree={selectNode}
                />
              ) : null}
            </div>
          )}

          {simulation ? (
            <Note icon={<Info className="size-4" />}>
              Une feuille vide est <strong>absente</strong>, pas nulle : comme une modalité jamais
              observée pour un territoire, elle sort du calcul. Dans la vraie vie, somme ou moyenne
              est un choix de chaque indicateur qui utilise l’axe.
            </Note>
          ) : null}

          {nbAlertes > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-text">
                Points d’attention{' '}
                <span className="font-normal text-text-subtle">({nbAlertes})</span>
              </h3>
              {niveauxVides.map((n) => (
                <Note key={n.ordre} tone="warning">
                  Le niveau <strong>{n.nom}</strong> n’a aucune modalité.
                </Note>
              ))}
              {feuillesIntermediaires.slice(0, ALERTES_LIMIT).map((f) => (
                <Note key={f.id} tone="warning">
                  <strong>{f.nom}</strong> s’arrête avant le niveau « {niveaux.at(-1)?.nom} » :
                  c’est une feuille, on saisira directement dessus.
                </Note>
              ))}
              {parentsUniques.slice(0, ALERTES_LIMIT).map((p) => (
                <Note key={p.id}>
                  <strong>{p.nom}</strong> n’a qu’un enfant : elle aura toujours la même valeur que
                  lui.
                </Note>
              ))}
              {feuillesIntermediaires.length + parentsUniques.length > ALERTES_LIMIT * 2 ? (
                <p className="text-xs text-text-subtle">Liste tronquée.</p>
              ) : null}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function Lien({
  from,
  to,
  nodeW,
  on,
  dimmed,
  dashed = false,
}: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  nodeW: number
  on: boolean
  dimmed: boolean
  dashed?: boolean
}) {
  const x1 = from.x + nodeW
  const y1 = from.y + NODE_H / 2
  const x2 = to.x - 2
  const y2 = to.y + NODE_H / 2
  const mid = (x1 + x2) / 2
  return (
    <path
      d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
      fill="none"
      markerEnd={`url(#fleche-${on ? 'on' : 'off'})`}
      strokeDasharray={dashed ? '4 4' : undefined}
      className={clsxm(
        'transition-opacity',
        on ? 'stroke-primary' : 'stroke-border-strong',
        dimmed && 'opacity-25',
      )}
      strokeWidth={on ? 2 : 1.25}
    />
  )
}

const KIND_ACCENT: Record<Kind, string> = {
  feuille: 'bg-success-425',
  parente: 'bg-primary',
  tous: 'bg-text',
}

const KIND_LABEL: Record<Kind, string> = {
  feuille: 'Modalité feuille · saisie',
  parente: 'Modalité parente · calculée',
  tous: 'Tous',
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
}) {
  return (
    <div className="inline-flex rounded-md bg-surface-muted p-0.5 text-xs font-semibold">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsxm(
            'rounded px-2.5 py-1',
            value === option.value ? 'bg-surface text-primary shadow-sm' : 'text-text-muted',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function Legende({ kind, children }: { kind: Kind; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsxm('size-2.5 rounded-full', KIND_ACCENT[kind])} />
      {children}
    </span>
  )
}

function Glossaire({
  axeNom,
  niveaux,
  nodes,
  editable,
  vide,
  onAjouterRacine,
}: {
  axeNom: string
  niveaux: ReadonlyArray<NiveauAxeApiModel>
  nodes: Map<string, LayoutNode>
  editable: boolean
  vide: boolean
  onAjouterRacine: () => void
}) {
  const exemple = (kind: Kind) => [...nodes.values()].find((n) => n.kind === kind)?.nom
  return (
    <section className="flex flex-col gap-4">
      {vide && editable ? (
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-primary/40 p-4">
          <p className="text-sm text-text">Cet axe n’a encore aucune modalité.</p>
          <Button size="sm" onClick={onAjouterRacine} className="self-start">
            <Plus /> Ajouter la première
          </Button>
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-text">Comment lire ce graphe</h3>
      <dl className="flex flex-col gap-3.5 text-sm">
        <Definition terme="Axe" exemple={axeNom}>
          Une façon de découper un indicateur, en plus du territoire.
        </Definition>
        <Definition terme="Niveau" exemple={niveaux.map((n) => n.nom).join(' → ')}>
          Un étage de l’axe, du plus large au plus fin. Chaque colonne est un niveau.
        </Definition>
        <Definition terme="Modalité">
          Une valeur possible de l’axe. Chaque boîte est une modalité, rangée dans la colonne de son
          niveau.
        </Definition>
        <Definition terme="Feuille" kind="feuille" exemple={exemple('feuille')}>
          Une modalité sans enfant : c’est la seule où l’on saisit des valeurs.
        </Definition>
        <Definition terme="Parente" kind="parente" exemple={exemple('parente')}>
          Une modalité avec des enfants : sa valeur en est la somme ou la moyenne, jamais saisie.
        </Definition>
        <Definition terme="Tous" kind="tous">
          L’ensemble de l’axe, calculé à partir du premier niveau. C’est la valeur lue quand on ne
          précise aucune modalité.
        </Definition>
      </dl>
      <Note icon={<MousePointerClick className="size-4" />}>
        {editable
          ? 'Cliquez sur une boîte ou sur l’en-tête d’une colonne pour l’expliquer ou la modifier. Le « + » d’une boîte lui ajoute un enfant.'
          : 'Cliquez sur une boîte ou sur l’en-tête d’une colonne pour l’expliquer.'}
      </Note>
    </section>
  )
}

function Definition({
  terme,
  kind,
  exemple,
  children,
}: {
  terme: string
  kind?: Kind
  exemple?: string | undefined
  children: ReactNode
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 font-medium text-text">
        {kind ? <span className={clsxm('size-2.5 rounded-full', KIND_ACCENT[kind])} /> : null}
        {terme}
      </dt>
      <dd className="text-text-muted">
        {children}
        {exemple ? <span className="text-text-subtle"> Ex. : {exemple}.</span> : null}
      </dd>
    </div>
  )
}

const INPUT =
  'w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-text focus:border-primary focus:outline-none'

function FormulaireAjout({
  parent,
  nomNiveau,
  existants,
  edition,
  onCree,
}: {
  parent: LayoutNode | null
  nomNiveau: (ordre: number) => string
  existants: Map<string, LayoutNode>
  edition: Edition
  onCree: (id: string) => void
}) {
  const niveau = parent ? parent.niveau + 1 : 1
  const [nom, setNom] = useState('')
  const [id, setId] = useState('')
  const [idTouche, setIdTouche] = useState(false)
  const idFinal = idTouche ? id : suggestId(nom, parent?.id ?? null)
  const idValide = modalitePublicIdSchema.safeParse(idFinal).success
  const doublon = existants.has(idFinal)

  return (
    <form
      className="flex flex-col gap-4 text-sm"
      onSubmit={(event) => {
        event.preventDefault()
        edition.enregistrerModalite.mutate(
          { id: idFinal, nom, parent: parent?.id ?? null },
          { onSuccess: () => onCree(idFinal) },
        )
      }}
    >
      <div>
        <p className="text-xs text-text-muted">Nouvelle modalité</p>
        <h3 className="mt-1 text-lg font-semibold text-text">
          {parent ? `Sous ${parent.nom}` : 'Au premier niveau'}
        </h3>
        <p className="text-xs text-text-muted">
          Elle sera au niveau {niveau} « {nomNiveau(niveau)} »
          {parent
            ? `, et ${parent.nom} deviendra (ou restera) une modalité parente.`
            : ', directement sous « Tous ».'}
        </p>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text">Nom</span>
        <input
          autoFocus
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          placeholder="Orange"
          className={INPUT}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text">Identifiant</span>
        <input
          value={idFinal}
          onChange={(event) => {
            setIdTouche(true)
            setId(event.target.value.toUpperCase())
          }}
          placeholder="OP-ORANGE"
          className={clsxm(INPUT, 'font-mono')}
        />
        <span className={clsxm('text-xs', doublon ? 'text-error' : 'text-text-subtle')}>
          {doublon
            ? 'Cet identifiant existe déjà dans l’axe.'
            : 'Majuscules, chiffres et tirets, 20 caractères au plus. Non modifiable ensuite.'}
        </span>
      </label>
      <Button
        type="submit"
        size="sm"
        className="self-start"
        disabled={edition.pending || nom.trim() === '' || !idValide || doublon}
      >
        <Plus /> Ajouter
      </Button>
    </form>
  )
}

function DetailModalite({
  node,
  nodes,
  niveaux,
  nomNiveau,
  simulation,
  fonction,
  computed,
  editable,
  edition,
  onSelect,
  onAjouter,
  onSupprime,
}: {
  node: LayoutNode
  nodes: Map<string, LayoutNode>
  niveaux: ReadonlyArray<NiveauAxeApiModel>
  nomNiveau: (ordre: number) => string
  simulation: boolean
  fonction: Fonction
  computed: Map<string, Computed>
  editable: boolean
  edition: Edition
  onSelect: (id: string) => void
  onAjouter: (parent: string | null) => void
  onSupprime: () => void
}) {
  const children = node.children.map((id) => nodes.get(id)).filter((n): n is LayoutNode => !!n)
  const chaine = ancestorsOf(nodes, node.id)
  const separateur = fonction === 'SUM' ? ' + ' : ', '
  const valeur = (id: string) => {
    const v = computed.get(id)?.value
    return v == null ? '∅' : formatValue(v)
  }
  const enveloppe = (contenu: string) => (fonction === 'AVG' ? `moyenne(${contenu})` : contenu)
  const isTous = node.kind === 'tous'
  const peutAvoirEnfants = isTous || node.niveau < niveaux.length

  return (
    <div className="flex flex-col gap-5 text-sm">
      <div>
        <p className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className={clsxm('size-2.5 rounded-full', KIND_ACCENT[node.kind])} />
          {KIND_LABEL[node.kind]}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-text">{node.nom}</h3>
        <p className="text-xs text-text-muted">
          {isTous ? (
            'Ensemble de l’axe, calculé à la lecture, jamais stocké.'
          ) : (
            <>
              <code className="text-primary">{node.id}</code> · niveau {node.niveau} «{' '}
              {nomNiveau(node.niveau)} »
            </>
          )}
        </p>
      </div>

      <Section titre="D’où vient sa valeur">
        {node.kind === 'feuille' ? (
          <p className="text-text-muted">
            Elle est <strong className="text-text">saisie</strong> directement, pour chaque
            territoire et chaque date. Rien ne la calcule.
          </p>
        ) : children.length === 0 ? (
          <p className="text-text-muted">Aucune modalité : rien à calculer pour l’instant.</p>
        ) : (
          <>
            <p className="text-text-muted">
              Jamais saisie : c’est la{' '}
              <strong className="text-text">
                {simulation ? (fonction === 'SUM' ? 'somme' : 'moyenne') : 'somme ou la moyenne'}
              </strong>{' '}
              de ses {pluriel(children.length, 'enfant')}
              {simulation ? '' : ', selon l’indicateur'}.
            </p>
            <div className="rounded-md bg-surface-muted px-3 py-2 font-mono text-xs leading-relaxed text-text">
              <div>
                {node.nom} = {enveloppe(children.map((c) => c.nom).join(separateur))}
              </div>
              {simulation ? (
                <>
                  <div className="text-text-muted">
                    = {enveloppe(children.map((c) => valeur(c.id)).join(separateur))}
                  </div>
                  <div className="font-semibold">= {valeur(node.id)}</div>
                </>
              ) : null}
            </div>
            {simulation && children.some((c) => computed.get(c.id)?.value == null) ? (
              <p className="text-xs text-warning">
                ∅ = absente : elle sort du calcul, elle ne compte pas comme 0.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {children.map((c) => (
                <ChipModalite key={c.id} node={c} onSelect={onSelect} />
              ))}
            </div>
          </>
        )}
      </Section>

      {!isTous ? (
        <Section titre="Ce qu’elle alimente">
          <div className="flex flex-wrap items-center gap-1.5">
            <ChipModalite node={node} onSelect={onSelect} />
            {chaine.map((n) => (
              <span key={n.id} className="inline-flex items-center gap-1.5">
                <span className="text-text-subtle">→</span>
                <ChipModalite node={n} onSelect={onSelect} />
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {editable ? (
        <Section titre="Modifier">
          {!isTous ? (
            <Renommer
              key={node.nom}
              initial={node.nom}
              edition={edition}
              onSave={(nom) =>
                edition.enregistrerModalite.mutateAsync({
                  id: node.id,
                  nom,
                  parent: node.parent === TOUS_ID ? null : node.parent,
                })
              }
            />
          ) : null}
          <div className="flex flex-wrap gap-2">
            {peutAvoirEnfants ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onAjouter(isTous ? null : node.id)}
              >
                <Plus /> {isTous ? 'Modalité au niveau 1' : 'Ajouter un enfant'}
              </Button>
            ) : null}
            {!isTous ? (
              <Supprimer
                disabledReason={children.length > 0 ? 'Supprimez d’abord ses enfants.' : undefined}
                pending={edition.pending}
                onConfirm={() =>
                  edition.supprimerModalite.mutate(node.id, { onSuccess: onSupprime })
                }
              />
            ) : null}
          </div>
          {!isTous ? (
            <p className="text-xs text-text-subtle">
              Pour changer son parent ou son niveau : la supprimer, puis la recréer au bon endroit.
            </p>
          ) : null}
        </Section>
      ) : null}
    </div>
  )
}

function DetailNiveau({
  ordre,
  niveaux,
  nodes,
  nomNiveau,
  editable,
  edition,
  onSelect,
  onAjouter,
  onSupprime,
}: {
  ordre: number
  niveaux: ReadonlyArray<NiveauAxeApiModel>
  nodes: Map<string, LayoutNode>
  nomNiveau: (ordre: number) => string
  editable: boolean
  edition: Edition
  onSelect: (id: string) => void
  onAjouter: (parent: string | null) => void
  onSupprime: () => void
}) {
  const membres = [...nodes.values()].filter((n) => n.niveau === ordre)
  const parentsPossibles = [...nodes.values()].filter((n) => n.niveau === ordre - 1)
  const dernier = ordre === niveaux.length
  const noms = niveaux.map((n) => n.nom)
  return (
    <div className="flex flex-col gap-5 text-sm">
      <div>
        <p className="text-xs text-text-muted">
          Niveau {ordre} sur {niveaux.length}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-text">{nomNiveau(ordre)}</h3>
        <p className="text-xs text-text-muted">
          Un étage de l’axe, qui regroupe des modalités de même finesse.
        </p>
      </div>
      <Section titre="Sa place dans l’axe">
        <p className="text-text-muted">
          {ordre === 1
            ? 'Le plus large : ses modalités n’ont pas de parent et entrent directement dans « Tous ».'
            : `Chacune de ses modalités a un parent au niveau « ${nomNiveau(ordre - 1)} ».`}{' '}
          {dernier
            ? 'C’est le plus fin : ses modalités sont toutes des feuilles.'
            : `Ses modalités se découpent au niveau « ${nomNiveau(ordre + 1)} » ; celles qui ne se découpent pas restent des feuilles.`}
        </p>
      </Section>
      <Section titre={pluriel(membres.length, 'modalité')}>
        {membres.length === 0 ? (
          <p className="text-text-muted">Aucune modalité.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {membres.map((m) => (
              <ChipModalite key={m.id} node={m} onSelect={onSelect} />
            ))}
          </div>
        )}
      </Section>

      {editable ? (
        <Section titre="Modifier">
          <Renommer
            key={nomNiveau(ordre)}
            initial={nomNiveau(ordre)}
            edition={edition}
            onSave={(nom) =>
              edition.enregistrerNiveaux.mutateAsync(
                noms.map((n, index) => (index === ordre - 1 ? nom : n)),
              )
            }
          />
          {ordre === 1 ? (
            <Button
              size="sm"
              variant="secondary"
              className="self-start"
              onClick={() => onAjouter(null)}
            >
              <Plus /> Ajouter une modalité
            </Button>
          ) : parentsPossibles.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-text-muted">Ajouter une modalité ici, sous :</span>
              <div className="flex flex-wrap gap-1.5">
                {parentsPossibles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onAjouter(p.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/50 px-2.5 py-0.5 text-xs font-medium text-primary hover:bg-primary-tinted"
                  >
                    <Plus className="size-3" /> {p.nom}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              Ajoutez d’abord une modalité au niveau « {nomNiveau(ordre - 1)} ».
            </p>
          )}
          {dernier && niveaux.length > 1 ? (
            <Supprimer
              label="Supprimer ce niveau"
              disabledReason={membres.length > 0 ? 'Supprimez d’abord ses modalités.' : undefined}
              pending={edition.pending}
              onConfirm={() =>
                edition.enregistrerNiveaux.mutate(noms.slice(0, -1), { onSuccess: onSupprime })
              }
            />
          ) : null}
        </Section>
      ) : null}
    </div>
  )
}

function Renommer({
  initial,
  edition,
  onSave,
}: {
  initial: string
  edition: Edition
  onSave: (nom: string) => Promise<unknown>
}) {
  const [nom, setNom] = useState(initial)
  const changed = nom.trim() !== '' && nom.trim() !== initial
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        void onSave(nom.trim()).catch(() => undefined)
      }}
    >
      <input
        value={nom}
        onChange={(event) => setNom(event.target.value)}
        aria-label="Nom"
        className={INPUT}
      />
      <Button type="submit" size="sm" disabled={!changed || edition.pending}>
        Renommer
      </Button>
    </form>
  )
}

function Supprimer({
  label = 'Supprimer',
  disabledReason,
  pending,
  onConfirm,
}: {
  label?: string
  disabledReason?: string | undefined
  pending: boolean
  onConfirm: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={onConfirm}
          className="bg-error hover:bg-error/90"
        >
          Confirmer
        </Button>
        <Button size="sm" variant="tertiary" onClick={() => setConfirming(false)}>
          Annuler
        </Button>
      </span>
    )
  }
  return (
    <Button
      size="sm"
      variant="tertiary"
      disabled={!!disabledReason || pending}
      title={disabledReason}
      onClick={() => setConfirming(true)}
      className="self-start text-error hover:bg-error-tinted"
    >
      <Trash2 /> {label}
    </Button>
  )
}

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xs font-medium text-text-subtle">{titre}</h4>
      {children}
    </section>
  )
}

function ChipModalite({ node, onSelect }: { node: LayoutNode; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={clsxm(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        node.kind === 'tous'
          ? 'border-text bg-text text-primary-foreground'
          : 'border-border bg-surface text-text hover:border-primary',
      )}
    >
      {node.kind !== 'tous' ? (
        <span className={clsxm('size-2 rounded-full', KIND_ACCENT[node.kind])} />
      ) : null}
      {node.nom}
    </button>
  )
}

function GraphNode({
  node,
  width,
  selected,
  dimmed,
  match,
  simulation,
  fonction,
  saisie,
  computed,
  onHover,
  onSelect,
  onToggle,
  onAddChild,
  onSaisie,
}: {
  node: PlacedNode
  width: number
  selected: boolean
  dimmed: boolean
  match: boolean
  simulation: boolean
  fonction: Fonction
  saisie: string
  computed: Computed | undefined
  onHover: (id: string | null) => void
  onSelect: () => void
  onToggle: (() => void) | undefined
  onAddChild: (() => void) | undefined
  onSaisie: (value: string) => void
}) {
  const isTous = node.kind === 'tous'
  const isCollapsed = node.hidden > 0
  const incomplete = computed && node.kind !== 'feuille' && computed.present < computed.expected
  const meta =
    node.kind === 'feuille'
      ? 'Saisie'
      : node.children.length === 0
        ? 'Aucune modalité'
        : isCollapsed
          ? `${pluriel(node.hidden, 'modalité')} repliée${node.hidden > 1 ? 's' : ''}`
          : `${simulation ? (fonction === 'SUM' ? 'Somme' : 'Moyenne') : 'Calcul'} de ${pluriel(node.children.length, 'enfant')}`
  return (
    <div
      className={clsxm('group absolute transition-opacity', dimmed && 'opacity-30')}
      style={{ left: node.x, top: node.y, width, height: NODE_H }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      {isCollapsed ? (
        <>
          <span className="absolute inset-0 translate-x-2 translate-y-2 rounded-lg border border-border bg-surface" />
          <span className="absolute inset-0 translate-x-1 translate-y-1 rounded-lg border border-border bg-surface" />
        </>
      ) : null}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onSelect()
        }}
        className={clsxm(
          'relative flex h-full cursor-pointer items-stretch overflow-hidden rounded-lg border shadow-sm transition-colors',
          isTous
            ? 'border-text bg-text text-primary-foreground'
            : 'border-border bg-surface hover:border-primary/60',
          match && 'border-primary',
          selected && 'ring-2 ring-primary ring-offset-2',
        )}
      >
        {!isTous ? <span className={clsxm('w-1 shrink-0', KIND_ACCENT[node.kind])} /> : null}
        <div className="flex min-w-0 flex-1 flex-col justify-center px-3">
          <span className={clsxm('truncate text-sm font-medium', !isTous && 'text-text')}>
            {node.nom}
          </span>
          <span
            className={clsxm('truncate text-[11px]', isTous ? 'opacity-70' : 'text-text-muted')}
          >
            {meta}
          </span>
        </div>
        {simulation ? (
          <div className="flex shrink-0 items-center pr-2.5">
            {node.kind === 'feuille' ? (
              <input
                value={saisie}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => onSaisie(event.target.value)}
                placeholder="∅"
                inputMode="decimal"
                aria-label={`Valeur de ${node.nom}`}
                className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-right text-sm text-text tabular-nums placeholder:text-text-subtle focus:border-primary focus:outline-none"
              />
            ) : (
              <span className="text-right text-sm font-semibold tabular-nums">
                {computed?.value == null ? '∅' : formatValue(computed.value)}
                {incomplete ? (
                  <span className="block text-[10px] font-normal text-warning-425">
                    {computed.present}/{computed.expected} présents
                  </span>
                ) : null}
              </span>
            )}
          </div>
        ) : onAddChild ? (
          <div className="flex shrink-0 items-center pr-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onAddChild()
              }}
              title={
                isTous ? 'Ajouter une modalité au niveau 1' : `Ajouter un enfant à ${node.nom}`
              }
              className={clsxm(
                'flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100',
                isTous
                  ? 'text-primary-foreground hover:bg-surface/20'
                  : 'text-primary hover:bg-primary-tinted',
              )}
            >
              <Plus className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          title={isCollapsed ? 'Déplier' : 'Replier'}
          className="absolute top-1/2 -left-3 z-10 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full border border-border-strong bg-surface px-1 text-[11px] font-semibold text-text-muted shadow-sm hover:border-primary hover:text-primary"
        >
          {isCollapsed ? (
            <>
              <ChevronLeft className="size-3.5" />
              {node.hidden}
            </>
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
      ) : null}
    </div>
  )
}

function Note({
  children,
  tone = 'info',
  icon,
}: {
  children: ReactNode
  tone?: 'warning' | 'info'
  icon?: ReactNode
}) {
  return (
    <div
      className={clsxm(
        'flex gap-2 rounded-md px-3 py-2.5 text-xs leading-relaxed',
        tone === 'warning' ? 'bg-warning-tinted text-warning' : 'bg-surface-tinted text-text',
      )}
    >
      <span className="mt-px shrink-0">{icon ?? <AlertTriangle className="size-3.5" />}</span>
      <span>{children}</span>
    </div>
  )
}
