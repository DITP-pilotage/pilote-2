import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FunctionComponent, useMemo, useState } from "react";
import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";
import { clsxm } from "@/utils/clsxm";
import {
  aplatir,
  projeter,
  retirerDescendants,
  type NoeudPlat,
} from "./arbreDnd";

const INDENTATION = 20;

type CibleDeplacement = { parentId: string | null; index: number };

interface ArbreCentreAideDndProps {
  articles: ArticleCentreAideContrat[];
  selectionneId: string | null;
  onSelectionner: (id: string) => void;
  onDeplacer: (id: string, cible: CibleDeplacement) => void;
}

export const ArbreCentreAideDnd: FunctionComponent<ArbreCentreAideDndProps> = ({
  articles,
  selectionneId,
  onSelectionner,
  onDeplacer,
}) => {
  const [replies, setReplies] = useState<ReadonlySet<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [decalageX, setDecalageX] = useState(0);

  const platComplet = useMemo(
    () => aplatir(articles, replies),
    [articles, replies],
  );
  const plat = useMemo(
    () => (activeId ? retirerDescendants(platComplet, activeId) : platComplet),
    [platComplet, activeId],
  );
  const projection =
    activeId && overId
      ? projeter(plat, activeId, overId, decalageX, INDENTATION)
      : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const idsAvecEnfants = useMemo(() => {
    const identifiants = new Set<string>();
    for (const article of articles) {
      if (article.parentId) identifiants.add(article.parentId);
    }
    return identifiants;
  }, [articles]);

  const reinitialiser = () => {
    setActiveId(null);
    setOverId(null);
    setDecalageX(0);
  };

  const surDebut = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setOverId(String(event.active.id));
  };

  const surMouvement = (event: DragMoveEvent) => setDecalageX(event.delta.x);

  const surSurvol = (event: DragOverEvent) =>
    setOverId(event.over ? String(event.over.id) : null);

  const surFin = (_event: DragEndEvent) => {
    if (activeId && projection) {
      onDeplacer(activeId, {
        parentId: projection.parentId,
        index: projection.index,
      });
    }
    reinitialiser();
  };

  const basculerRepli = (id: string) =>
    setReplies((precedent) => {
      const suivant = new Set(precedent);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });

  if (plat.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-gray-400">
        Aucun article. Créez un groupe ou une page.
      </p>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragCancel={reinitialiser}
      onDragEnd={surFin}
      onDragMove={surMouvement}
      onDragOver={surSurvol}
      onDragStart={surDebut}
      sensors={sensors}
    >
      <SortableContext
        items={plat.map((noeud) => noeud.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex-1 overflow-y-auto py-2 select-none">
          {plat.map((noeud) => (
            <LigneArbre
              aEnfants={idsAvecEnfants.has(noeud.id)}
              depth={
                activeId === noeud.id && projection
                  ? projection.depth
                  : noeud.depth
              }
              key={noeud.id}
              noeud={noeud}
              onBasculerRepli={basculerRepli}
              onSelectionner={onSelectionner}
              replie={replies.has(noeud.id)}
              selectionne={selectionneId === noeud.id}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

const LigneArbre: FunctionComponent<{
  noeud: NoeudPlat;
  depth: number;
  selectionne: boolean;
  replie: boolean;
  aEnfants: boolean;
  onSelectionner: (id: string) => void;
  onBasculerRepli: (id: string) => void;
}> = ({
  noeud,
  depth,
  selectionne,
  replie,
  aEnfants,
  onSelectionner,
  onBasculerRepli,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: noeud.id });
  const estGroupe = noeud.type === "GROUPE";
  const titre =
    noeud.article.titreBrouillon || noeud.article.titre || "(sans titre)";

  return (
    <li
      className={clsxm("list-none", isDragging && "opacity-50")}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div
        className={clsxm(
          "group relative flex items-center gap-1 rounded pr-2 text-sm",
          selectionne
            ? "bg-blue-50 font-medium text-blue-700"
            : "text-gray-700 hover:bg-gray-50",
          noeud.article.estMasque && "opacity-50",
        )}
        style={{ paddingLeft: depth * INDENTATION + 6 }}
      >
        <button
          aria-label="Déplacer"
          className="flex cursor-grab px-0.5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
          type="button"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden className="text-xs">
            ⠿
          </span>
        </button>

        {estGroupe && aEnfants ? (
          <button
            aria-label={replie ? "Déplier" : "Replier"}
            className="flex w-3.5 shrink-0 text-gray-400"
            onClick={() => onBasculerRepli(noeud.id)}
            type="button"
          >
            <span
              className={clsxm(
                "inline-block text-xs transition-transform",
                !replie && "rotate-90",
              )}
            >
              ▸
            </span>
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <button
          className={clsxm(
            "flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left",
            estGroupe && "font-semibold",
          )}
          onClick={() => onSelectionner(noeud.id)}
          type="button"
        >
          <span className="flex-1 truncate">{titre}</span>
          <span
            className={clsxm(
              "size-1.5 shrink-0 rounded-full",
              noeud.article.estPublie ? "bg-green-500" : "bg-yellow-400",
            )}
            title={noeud.article.estPublie ? "Publié" : "Brouillon"}
          />
        </button>
      </div>
    </li>
  );
};
