import {
  type AxeApiModel,
  type FonctionAgregationAxe,
  type ModaliteApiModel,
  type NiveauAxeApiModel,
} from '@pilote/kpilote-shared/axe'
import {
  ArrowLeft,
  ChevronsDownUp,
  ChevronsUpDown,
  Dices,
  Eraser,
  Grid3x3,
  Info,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'

import { AddModaliteForm } from '@/components/axe-graphe/AddModaliteForm'
import { AxeTableur } from '@/components/axe-graphe/AxeTableur'
import { Glossary } from '@/components/axe-graphe/Glossary'
import { GraphCanvas } from '@/components/axe-graphe/GraphCanvas'
import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { ModaliteDetail } from '@/components/axe-graphe/ModaliteDetail'
import { NiveauDetail } from '@/components/axe-graphe/NiveauDetail'
import { Note } from '@/components/axe-graphe/Note'
import { Segmented } from '@/components/axe-graphe/Segmented'
import { Button } from '@pilote/kpilote-ui/Button'
import { Dialog } from '@pilote/kpilote-ui/Dialog'
import {
  type Arbre,
  type ArbreNode,
  buildArbre,
  initialCollapsed,
  type Kind,
  nodesOfKind,
  pluralize,
  pluralSuffix,
  TOUS_ID,
  toggleInSet,
  withTousNamed,
} from '@/lib/axeArbre'
import {
  buildGraphLayout,
  type Display,
  highlightedIdsOf,
  matchingIds,
  revealNode,
  type Selection,
  selectedNodeIdOf,
} from '@/lib/axeGraphe'
import {
  buildSampleSaisies,
  buildSampleValeurs,
  type Cellule,
  computeSerie,
  computeValeurs,
  PERIODES,
  type SaisiesSerie,
} from '@/lib/axeSerie'
import { type AxeEdition, useAxeEdition } from '@/mutations/axes'

const AUTO_COLLAPSE_AT = 60
const WARNINGS_LIMIT = 5

type Mode = 'edition' | 'simulation'
type View = 'graphe' | 'tableau'

// Un ref par callback : le conteneur du graphe est démonté par la vue tableau, l'observateur
// doit suivre chaque nouveau nœud.
const useElementWidth = () => {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0))
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
  return { ref: setElement, width }
}

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
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="top-4 h-[calc(100dvh-2rem)] max-h-none w-[calc(100vw-2rem)]">
          <AxeGraphe axe={axe} modalites={modalites} locked={locked} onClose={onClose} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

const searchSummaryOf = (count: number): string => {
  if (count === 0) return 'Aucune modalité ne correspond.'
  const shown = `affichée${pluralSuffix(count)}`
  return `${pluralize({ count, word: 'modalité' })} ${shown} (résultats et leurs parents)`
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
  const depth = Math.max(niveaux.length, ...modalites.map((modalite) => modalite.niveau))
  const arbre = useMemo(
    () => withTousNamed({ arbre: buildArbre(modalites), axeNom: axe.nom }),
    [modalites, axe.nom],
  )
  const edition = useAxeEdition(axe)
  const { ref, width: availableWidth } = useElementWidth()
  const [display, setDisplay] = useState<Display>(() => ({
    collapsed: initialCollapsed({ arbre, threshold: AUTO_COLLAPSE_AT }),
    showAll: new Set(),
  }))
  // Une modalité à rendre visible dès qu'elle figure dans l'arbre : une modalité créée n'y entre
  // qu'après le rechargement des modalités.
  const [pendingReveal, setPendingReveal] = useState<string | null>(null)
  if (pendingReveal !== null && arbre.has(pendingReveal)) {
    setPendingReveal(null)
    setDisplay(revealNode({ arbre, id: pendingReveal, display }))
  }
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)
  const [selection, setSelection] = useState<Selection>(null)
  const [mode, setMode] = useState<Mode>('edition')
  const [view, setView] = useState<View>('graphe')
  const [fonction, setFonction] = useState<FonctionAgregationAxe>('SUM')
  const [seed, setSeed] = useState(1)
  const [saisies, setSaisies] = useState<Record<string, string>>({})
  const [saisiesSerie, setSaisiesSerie] = useState<SaisiesSerie>(() =>
    buildSampleSaisies({ arbre }),
  )

  const isTableView = view === 'tableau'
  // Le tableau est toujours une simulation : le mode ne règle que l'édition du panneau.
  const isSimulating = !isTableView && mode === 'simulation'
  const isEditing = isTableView || mode === 'edition'

  const visible = useMemo(() => matchingIds({ arbre, search }), [arbre, search])
  const layout = useMemo(
    () => buildGraphLayout({ arbre, depth, availableWidth, display, visible }),
    [arbre, depth, availableWidth, display, visible],
  )
  const valeurs = useMemo(
    () => computeValeurs({ arbre, saisies, fonction }),
    [arbre, saisies, fonction],
  )
  const serie = useMemo(
    () => computeSerie({ arbre, saisies: saisiesSerie, fonction }),
    [arbre, saisiesSerie, fonction],
  )

  const selectedNodeId = selectedNodeIdOf(selection)
  const focus = hovered ?? selectedNodeId
  const highlighted = highlightedIdsOf({ arbre, focus, selection })
  const parentes = nodesOfKind({ arbre, kind: 'parente' })

  const niveauNomOf = (ordre: number) =>
    niveaux.find((niveau) => niveau.ordre === ordre)?.nom ?? `Niveau ${ordre}`
  const canAddChild = (node: ArbreNode) => node.kind === 'tous' || node.niveau < niveaux.length

  const toggleCollapse = (id: string) =>
    setDisplay((current) => ({
      ...current,
      collapsed: toggleInSet({ set: current.collapsed, id }),
    }))
  const expand = (id: string) =>
    setDisplay((current) => {
      const collapsed = new Set(current.collapsed)
      collapsed.delete(id)
      return { ...current, collapsed }
    })
  const selectNode = (id: string) => {
    setPendingReveal(id)
    setSelection({ type: 'node', id })
  }
  const toggleNodeSelection = (id: string) =>
    setSelection((current) =>
      current?.type === 'node' && current.id === id ? null : { type: 'node', id },
    )
  const startAdding = (parent: string | null) => {
    if (parent) {
      setPendingReveal(parent)
      expand(parent)
    }
    setSelection({ type: 'ajout', parent })
  }

  const randomize = (full: boolean) => {
    const nextSeed = seed + 1
    setSeed(nextSeed)
    if (isTableView) setSaisiesSerie(buildSampleSaisies({ arbre, seed: nextSeed, full }))
    else setSaisies(buildSampleValeurs({ arbre, seed: nextSeed, full }))
  }
  const clearSaisies = () => {
    if (isTableView) setSaisiesSerie({})
    else setSaisies({})
  }
  const addNiveau = () =>
    edition.saveNiveaux({
      names: [...niveaux.map((niveau) => niveau.nom), `Niveau ${niveaux.length + 1}`],
      onSuccess: () => setSelection({ type: 'niveau', ordre: niveaux.length + 1 }),
    })

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border px-6 py-3">
        <div className="mr-auto">
          <Dialog.Title>Axe {axe.nom}</Dialog.Title>
          <Dialog.Description className="text-xs">
            {pluralize({ count: arbre.size - 1, word: 'modalité' })} ·{' '}
            {isTableView
              ? 'un exemple de valeurs mois par mois : on saisit sur les feuilles, le reste se calcule.'
              : 'les valeurs se saisissent sur les feuilles, à gauche, et remontent vers la droite jusqu’à « Tous ».'}
          </Dialog.Description>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <Legend kind="feuille">Feuille (saisie)</Legend>
          <Legend kind="parente">Parente (calculée)</Legend>
          <Legend kind="tous">Tous</Legend>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'graphe', label: 'Graphe' },
              { value: 'tableau', label: 'Tableau' },
            ]}
          />
          {isTableView ? null : (
            <Segmented
              value={mode}
              onChange={(value) => {
                setMode(value)
                if (value === 'simulation' && selection?.type === 'ajout') setSelection(null)
              }}
              options={[
                { value: 'edition', label: 'Modifier' },
                { value: 'simulation', label: 'Simuler' },
              ]}
            />
          )}
          {isTableView || isSimulating ? null : (
            <Button
              size="sm"
              variant="secondary"
              disabled={locked || edition.isPending}
              onClick={addNiveau}
            >
              <Plus /> Niveau
            </Button>
          )}
          {isSimulating || isTableView ? (
            <SimulationControls
              fonction={fonction}
              onFonctionChange={setFonction}
              onRandomize={randomize}
              onClear={clearSaisies}
            />
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
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une modalité"
            aria-label="Rechercher une modalité"
            className="w-72 rounded-md border border-border bg-surface py-1.5 pr-2.5 pl-8 text-sm text-text focus:border-primary focus:outline-none"
          />
        </label>
        {visible ? (
          <span className="text-xs text-text-muted">{searchSummaryOf(visible.size - 1)}</span>
        ) : (
          <>
            <Button
              size="sm"
              variant="tertiary"
              disabled={parentes.length === 0}
              onClick={() =>
                setDisplay((current) => ({
                  ...current,
                  collapsed: new Set(parentes.map((parente) => parente.id)),
                }))
              }
            >
              <ChevronsDownUp /> Tout replier
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              disabled={display.collapsed.size === 0}
              onClick={() => setDisplay((current) => ({ ...current, collapsed: new Set() }))}
            >
              <ChevronsUpDown /> Tout déplier
            </Button>
          </>
        )}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        {isTableView ? (
          <AxeTableur
            arbre={arbre}
            niveauNomOf={niveauNomOf}
            collapsed={display.collapsed}
            visible={visible}
            fonction={fonction}
            saisies={saisiesSerie}
            serie={serie}
            selectedNodeId={selectedNodeId}
            onToggle={toggleCollapse}
            onSelectNode={toggleNodeSelection}
            onSaisie={({ id, index, value }) =>
              setSaisiesSerie((current) => ({
                ...current,
                [id]: PERIODES.map((_, periode) =>
                  periode === index ? value : (current[id]?.[periode] ?? ''),
                ),
              }))
            }
          />
        ) : (
          <div ref={ref} className="min-h-0 overflow-auto bg-surface-muted">
            {availableWidth > 0 ? (
              <GraphCanvas
                layout={layout}
                depth={depth}
                niveauCount={niveaux.length}
                niveauNomOf={niveauNomOf}
                selection={selection}
                selectedNodeId={selectedNodeId}
                focus={focus}
                highlighted={highlighted}
                isSearching={visible !== null}
                isSimulating={isSimulating}
                fonction={fonction}
                saisies={saisies}
                valeurs={valeurs}
                canAddChild={(node) => isEditing && canAddChild(node)}
                locked={locked}
                onSelectNiveau={(ordre) =>
                  setSelection((current) =>
                    current?.type === 'niveau' && current.ordre === ordre
                      ? null
                      : { type: 'niveau', ordre },
                  )
                }
                onSelectNode={toggleNodeSelection}
                onHover={setHovered}
                onToggle={toggleCollapse}
                onAddChild={(node) => startAdding(node.kind === 'tous' ? null : node.id)}
                onSaisie={({ id, value }) => setSaisies((current) => ({ ...current, [id]: value }))}
                onShowAll={(parent) =>
                  setDisplay((current) => ({
                    ...current,
                    showAll: new Set(current.showAll).add(parent),
                  }))
                }
              />
            ) : null}
          </div>
        )}

        <aside className="flex min-h-0 flex-col gap-6 overflow-y-auto border-l border-border px-6 py-5">
          {selection === null ? (
            <Glossary
              axeNom={axe.nom}
              niveaux={niveaux}
              arbre={arbre}
              isEditing={isEditing}
              locked={locked}
              onAddRoot={() => startAdding(null)}
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
              <SelectionPanel
                selection={selection}
                arbre={arbre}
                niveaux={niveaux}
                niveauNomOf={niveauNomOf}
                isSimulating={isSimulating}
                fonction={fonction}
                valeurs={valeurs}
                isEditing={isEditing}
                locked={locked}
                edition={edition}
                onSelect={selectNode}
                onAdd={startAdding}
                onDeleted={() => setSelection(null)}
              />
            </div>
          )}

          {isSimulating ? (
            <Note icon={<Info className="size-4" />}>
              Une feuille vide est <strong>absente</strong>, pas nulle : comme une modalité jamais
              observée pour un individu, elle sort du calcul. Dans la vraie vie, somme ou moyenne
              est un choix de chaque indicateur qui utilise l’axe.
            </Note>
          ) : null}

          <AxeWarnings arbre={arbre} niveaux={niveaux} />
        </aside>
      </div>
    </div>
  )
}

function Legend({ kind, children }: { kind: Kind; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <KindMarker kind={kind} shape="large-dot" />
      {children}
    </span>
  )
}

function SimulationControls({
  fonction,
  onFonctionChange,
  onRandomize,
  onClear,
}: {
  fonction: FonctionAgregationAxe
  onFonctionChange: (fonction: FonctionAgregationAxe) => void
  onRandomize: (full: boolean) => void
  onClear: () => void
}) {
  return (
    <>
      <Segmented
        value={fonction}
        onChange={onFonctionChange}
        options={[
          { value: 'SUM', label: 'Somme' },
          { value: 'AVG', label: 'Moyenne' },
        ]}
      />
      <Button
        size="sm"
        variant="tertiary"
        onClick={() => onRandomize(false)}
        title="Valeurs au hasard, avec des cases vides"
      >
        <Dices />
      </Button>
      <Button
        size="sm"
        variant="tertiary"
        onClick={() => onRandomize(true)}
        title="Valeurs au hasard, sans case vide"
      >
        <Grid3x3 />
      </Button>
      <Button size="sm" variant="tertiary" onClick={onClear} title="Vider">
        <Eraser />
      </Button>
    </>
  )
}

function SelectionPanel({
  selection,
  arbre,
  niveaux,
  niveauNomOf,
  isSimulating,
  fonction,
  valeurs,
  isEditing,
  locked,
  edition,
  onSelect,
  onAdd,
  onDeleted,
}: {
  selection: NonNullable<Selection>
  arbre: Arbre
  niveaux: ReadonlyArray<NiveauAxeApiModel>
  niveauNomOf: (ordre: number) => string
  isSimulating: boolean
  fonction: FonctionAgregationAxe
  valeurs: Map<string, Cellule>
  isEditing: boolean
  locked: boolean
  edition: AxeEdition
  onSelect: (id: string) => void
  onAdd: (parent: string | null) => void
  onDeleted: () => void
}) {
  if (selection.type === 'niveau') {
    return (
      <NiveauDetail
        key={selection.ordre}
        ordre={selection.ordre}
        niveaux={niveaux}
        arbre={arbre}
        niveauNomOf={niveauNomOf}
        isEditing={isEditing}
        locked={locked}
        edition={edition}
        onSelect={onSelect}
        onAdd={onAdd}
        onDeleted={onDeleted}
      />
    )
  }
  if (selection.type === 'ajout') {
    return (
      <AddModaliteForm
        key={selection.parent ?? TOUS_ID}
        parent={selection.parent ? (arbre.get(selection.parent) ?? null) : null}
        niveauNomOf={niveauNomOf}
        arbre={arbre}
        edition={edition}
        locked={locked}
        onCreated={onSelect}
      />
    )
  }
  const node = arbre.get(selection.id)
  if (!node) return null
  return (
    <ModaliteDetail
      key={node.id}
      node={node}
      arbre={arbre}
      niveaux={niveaux}
      niveauNomOf={niveauNomOf}
      isSimulating={isSimulating}
      fonction={fonction}
      valeurs={valeurs}
      isEditing={isEditing}
      locked={locked}
      edition={edition}
      onSelect={onSelect}
      onAdd={onAdd}
      onDeleted={onDeleted}
    />
  )
}

function AxeWarnings({
  arbre,
  niveaux,
}: {
  arbre: Arbre
  niveaux: ReadonlyArray<NiveauAxeApiModel>
}) {
  const nodes = [...arbre.values()]
  const emptyNiveaux = niveaux.filter(
    (niveau) => !nodes.some((node) => node.kind !== 'tous' && node.niveau === niveau.ordre),
  )
  const earlyFeuilles = nodesOfKind({ arbre, kind: 'feuille' }).filter(
    (feuille) => feuille.niveau < niveaux.length,
  )
  const singleChildParentes = nodesOfKind({ arbre, kind: 'parente' }).filter(
    (parente) => parente.children.length === 1,
  )
  const count = emptyNiveaux.length + earlyFeuilles.length + singleChildParentes.length
  if (count === 0) return null
  const isTruncated = earlyFeuilles.length + singleChildParentes.length > WARNINGS_LIMIT * 2
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text">
        Points d’attention <span className="font-normal text-text-subtle">({count})</span>
      </h3>
      {emptyNiveaux.map((niveau) => (
        <Note key={niveau.ordre} tone="warning">
          Le niveau <strong>{niveau.nom}</strong> n’a aucune modalité.
        </Note>
      ))}
      {earlyFeuilles.slice(0, WARNINGS_LIMIT).map((feuille) => (
        <Note key={feuille.id} tone="warning">
          <strong>{feuille.nom}</strong> s’arrête avant le niveau « {niveaux.at(-1)?.nom} » : c’est
          une feuille, on saisira directement dessus.
        </Note>
      ))}
      {singleChildParentes.slice(0, WARNINGS_LIMIT).map((parente) => (
        <Note key={parente.id}>
          <strong>{parente.nom}</strong> n’a qu’un enfant : elle aura toujours la même valeur que
          lui.
        </Note>
      ))}
      {isTruncated ? <p className="text-xs text-text-subtle">Liste tronquée.</p> : null}
    </section>
  )
}
