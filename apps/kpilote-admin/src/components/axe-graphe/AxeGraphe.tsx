import {
  type AxeApiModel,
  type FonctionAgregationAxe,
  type ModaliteApiModel,
} from '@pilote/kpilote-shared/axe'
import { ArrowLeft, Info, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AxeTableur } from '@/components/axe-graphe/AxeTableur'
import { AxeWarnings } from '@/components/axe-graphe/AxeWarnings'
import { Glossary } from '@/components/axe-graphe/Glossary'
import { GraphCanvas } from '@/components/axe-graphe/GraphCanvas'
import { KindLegend } from '@/components/axe-graphe/KindLegend'
import { ModaliteSearchBar } from '@/components/axe-graphe/ModaliteSearchBar'
import { Note } from '@/components/axe-graphe/Note'
import { Segmented } from '@/components/axe-graphe/Segmented'
import { SelectionPanel } from '@/components/axe-graphe/SelectionPanel'
import { SimulationControls } from '@/components/axe-graphe/SimulationControls'
import { useElementWidth } from '@/components/axe-graphe/useElementWidth'
import { Button } from '@pilote/kpilote-ui/Button'
import { Dialog } from '@pilote/kpilote-ui/Dialog'
import {
  type ArbreNode,
  buildArbre,
  initialCollapsed,
  nodesOfKind,
  pluralizeCount,
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
  computeSerie,
  computeValeurs,
  PERIODES,
  type SaisiesSerie,
} from '@/lib/axeSerie'
import { useAxeEdition } from '@/mutations/axes'

const AUTO_COLLAPSE_AT = 60

type Mode = 'edition' | 'simulation'
type View = 'graphe' | 'tableau'

export function AxeGraphe({
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
            {pluralizeCount({ count: arbre.size - 1, word: 'modalité' })} ·{' '}
            {isTableView
              ? 'un exemple de valeurs mois par mois : on saisit sur les feuilles, le reste se calcule.'
              : 'les valeurs se saisissent sur les feuilles, à gauche, et remontent vers la droite jusqu’à « Tous ».'}
          </Dialog.Description>
        </div>
        <KindLegend />
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

      <ModaliteSearchBar
        search={search}
        matchCount={visible ? visible.size - 1 : null}
        canCollapseAll={parentes.length > 0}
        canExpandAll={display.collapsed.size > 0}
        onSearchChange={setSearch}
        onCollapseAll={() =>
          setDisplay((current) => ({
            ...current,
            collapsed: new Set(parentes.map((parente) => parente.id)),
          }))
        }
        onExpandAll={() => setDisplay((current) => ({ ...current, collapsed: new Set() }))}
      />

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
