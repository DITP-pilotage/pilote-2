import type { ArticleCentreAideApiModel } from '@pilote/kpilote-shared/centreAide'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import { useMemo, useState } from 'react'

import { clsxm } from '@/lib/clsxm'
import { aplatir, projeter, retirerDescendants, type NoeudPlat } from './arbreDnd'

const INDENTATION = 20

type Props = {
  articles: ArticleCentreAideApiModel[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDeplacer: (id: string, cible: { parentId: string | null; index: number }) => void
}

export function ArbreCentreAide({ articles, selectedId, onSelect, onDeplacer }: Props) {
  const [replies, setReplies] = useState<ReadonlySet<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [decalageX, setDecalageX] = useState(0)

  const platComplet = useMemo(() => aplatir(articles, replies), [articles, replies])
  const plat = useMemo(
    () => (activeId ? retirerDescendants(platComplet, activeId) : platComplet),
    [platComplet, activeId],
  )
  const projection =
    activeId && overId ? projeter(plat, activeId, overId, decalageX, INDENTATION) : null

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const idsEnfantsParParent = useMemo(() => {
    const set = new Set<string>()
    for (const article of articles) if (article.parentId) set.add(article.parentId)
    return set
  }, [articles])

  const reinitialiser = () => {
    setActiveId(null)
    setOverId(null)
    setDecalageX(0)
  }

  const surDebut = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
    setOverId(String(event.active.id))
  }
  const surMouvement = (event: DragMoveEvent) => setDecalageX(event.delta.x)
  const surSurvol = (event: DragOverEvent) => setOverId(event.over ? String(event.over.id) : null)
  const surFin = (_event: DragEndEvent) => {
    if (activeId && projection) {
      onDeplacer(activeId, { parentId: projection.parentId, index: projection.index })
    }
    reinitialiser()
  }

  const basculerRepli = (id: string) =>
    setReplies((precedent) => {
      const suivant = new Set(precedent)
      if (suivant.has(id)) suivant.delete(id)
      else suivant.add(id)
      return suivant
    })

  if (plat.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-text-subtle">
        Aucun article. Créez un groupe ou une page.
      </p>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={surDebut}
      onDragMove={surMouvement}
      onDragOver={surSurvol}
      onDragEnd={surFin}
      onDragCancel={reinitialiser}
    >
      <SortableContext items={plat.map((noeud) => noeud.id)} strategy={verticalListSortingStrategy}>
        <ul className="select-none">
          {plat.map((noeud) => (
            <LigneArbre
              key={noeud.id}
              noeud={noeud}
              depth={activeId === noeud.id && projection ? projection.depth : noeud.depth}
              selectionne={selectedId === noeud.id}
              replie={replies.has(noeud.id)}
              aEnfants={idsEnfantsParParent.has(noeud.id)}
              onSelect={onSelect}
              onBasculerRepli={basculerRepli}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function LigneArbre({
  noeud,
  depth,
  selectionne,
  replie,
  aEnfants,
  onSelect,
  onBasculerRepli,
}: {
  noeud: NoeudPlat
  depth: number
  selectionne: boolean
  replie: boolean
  aEnfants: boolean
  onSelect: (id: string) => void
  onBasculerRepli: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: noeud.id,
  })
  const style = { transform: CSS.Translate.toString(transform), transition }
  const estGroupe = noeud.type === 'GROUPE'
  const titre = noeud.article.titreBrouillon || noeud.article.titre || '(sans titre)'

  return (
    <li ref={setNodeRef} style={style} className={clsxm('list-none', isDragging && 'opacity-50')}>
      <div
        onClick={() => onSelect(noeud.id)}
        style={{ paddingLeft: depth * INDENTATION + 6 }}
        className={clsxm(
          'group relative flex cursor-pointer items-center gap-1 py-1.5 pr-2 text-sm',
          selectionne
            ? 'rounded-md bg-primary-tinted font-medium text-primary'
            : 'rounded-md text-text hover:bg-surface-tinted',
        )}
      >
        {Array.from({ length: depth }).map((_, niveau) => (
          <span
            key={niveau}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 border-l border-border"
            style={{ left: niveau * INDENTATION + 15 }}
          />
        ))}

        <button
          type="button"
          aria-label="Déplacer"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          className="flex cursor-grab text-text-subtle opacity-0 transition-opacity group-hover:opacity-100"
        >
          <GripVertical className="size-3.5" />
        </button>

        {estGroupe && aEnfants ? (
          <button
            type="button"
            aria-label={replie ? 'Déplier' : 'Replier'}
            onClick={(event) => {
              event.stopPropagation()
              onBasculerRepli(noeud.id)
            }}
            className="flex text-text-subtle"
          >
            {replie ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <span className={clsxm('flex-1 truncate', estGroupe && 'font-semibold text-text')}>
          {titre}
        </span>

        {estGroupe ? null : (
          <span
            className={clsxm(
              'size-1.5 shrink-0 rounded-full',
              noeud.article.estPublie ? 'bg-success' : 'bg-warning',
            )}
            title={noeud.article.estPublie ? 'Publié' : 'Brouillon'}
          />
        )}
      </div>
    </li>
  )
}
