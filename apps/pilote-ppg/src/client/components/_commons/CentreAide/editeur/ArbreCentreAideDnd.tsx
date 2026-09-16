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
import { FunctionComponent, useMemo, useRef, useState } from "react";
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
  onRenommer: (id: string, titre: string) => void;
}

export const ArbreCentreAideDnd: FunctionComponent<ArbreCentreAideDndProps> = ({
  articles,
  selectionneId,
  onSelectionner,
  onDeplacer,
  onRenommer,
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
              onRenommer={onRenommer}
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
  onRenommer: (id: string, titre: string) => void;
}> = ({
  noeud,
  depth,
  selectionne,
  replie,
  aEnfants,
  onSelectionner,
  onBasculerRepli,
  onRenommer,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: noeud.id });
  const champRenommage = useRef<HTMLInputElement>(null);
  const [renommage, setRenommage] = useState<string | null>(null);

  const estGroupe = noeud.type === "GROUPE";
  const titre =
    noeud.article.titreBrouillon || noeud.article.titre || "(sans titre)";

  const validerRenommage = () => {
    const propre = renommage?.trim();
    if (propre && propre !== titre) onRenommer(noeud.id, propre);
    setRenommage(null);
  };

  return (
    <li
      className={clsxm("list-none", isDragging && "opacity-50")}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div
        className={clsxm(
          "group relative flex items-center gap-1 rounded-sm pr-2 text-[13px]",
          selectionne
            ? "bg-dsfr-alt-blue-france font-medium text-primary"
            : "text-dsfr-grey-200 hover:bg-dsfr-grey-1000",
          noeud.article.estMasque && "opacity-45",
        )}
        style={{ paddingLeft: depth * INDENTATION + 6 }}
      >
        <button
          aria-label="Déplacer"
          className="flex cursor-grab px-0.5 text-dsfr-grey-625 opacity-0 transition-opacity group-hover:opacity-100"
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
            className="flex w-3.5 shrink-0 text-dsfr-grey-625"
            onClick={() => onBasculerRepli(noeud.id)}
            type="button"
          >
            <span
              className={clsxm(
                "inline-block text-[10px] transition-transform",
                !replie && "rotate-90",
              )}
            >
              ▸
            </span>
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {renommage === null ? (
          <button
            className={clsxm(
              "flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left",
              estGroupe && "font-medium",
            )}
            onClick={() => onSelectionner(noeud.id)}
            onDoubleClick={() => {
              setRenommage(titre);
              requestAnimationFrame(() => {
                champRenommage.current?.focus();
                champRenommage.current?.select();
              });
            }}
            title="Double-cliquez pour renommer"
            type="button"
          >
            <span className="flex-1 truncate">{titre}</span>
            <PastilleEtat article={noeud.article} />
          </button>
        ) : (
          <input
            className="min-w-0 flex-1 rounded-sm border border-primary bg-white px-1 py-1 text-[13px] text-dsfr-grey-50 outline-none"
            onBlur={validerRenommage}
            onChange={(event) => setRenommage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") validerRenommage();
              if (event.key === "Escape") setRenommage(null);
            }}
            ref={champRenommage}
            value={renommage}
          />
        )}
      </div>
    </li>
  );
};

// La pastille encode l'etat de publication ; c'est le seul endroit de l'arbre ou
// la couleur porte une information.
const PastilleEtat: FunctionComponent<{
  article: NoeudPlat["article"];
}> = ({ article }) => {
  const [couleur, libelle] = article.estMasque
    ? ["bg-dsfr-grey-625", "Masqué"]
    : article.estPublie
      ? ["bg-dsfr-success-425", "Publié"]
      : ["bg-dsfr-moutarde-main-679", "Brouillon"];

  return (
    <span
      className={clsxm("size-1.5 shrink-0 rounded-full", couleur)}
      title={libelle}
    />
  );
};
