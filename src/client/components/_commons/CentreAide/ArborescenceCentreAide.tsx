import { FunctionComponent, useState } from "react";
import { NoeudArbre, aDesModificationsNonPubliees } from "./types";

const BadgesStatut: FunctionComponent<{ noeud: NoeudArbre }> = ({ noeud }) => {
  const estBrouillon = !noeud.estPublie;
  const aModifsNonPubliees = aDesModificationsNonPubliees(noeud);

  return (
    <div className="flex gap-1 shrink-0 ml-auto">
      {noeud.estPublie && !aModifsNonPubliees && (
        <span className="w-2 h-2 rounded-full bg-green-500" title="Publié" />
      )}
      {noeud.estMasque && (
        <span className="w-2 h-2 rounded-full bg-gray-400" title="Masqué" />
      )}
      {estBrouillon && (
        <span
          className="w-2 h-2 rounded-full bg-yellow-400"
          title="Brouillon"
        />
      )}
      {aModifsNonPubliees && (
        <span
          className="w-2 h-2 rounded-full bg-orange-400"
          title="Modifications non publiées"
        />
      )}
    </div>
  );
};

interface NoeudArbreProps {
  noeud: NoeudArbre;
  niveau: number;
  itemSelectionneId: string | null;
  onSelectionItem: (id: string) => void;
  estItemDesactive?: (noeud: NoeudArbre) => boolean;
  afficherStatut?: boolean;
  groupesOuverts: Set<string>;
  onToggleGroupe: (id: string) => void;
  onDeplacer?: (
    id: string,
    action: "monter" | "descendre" | "sortir" | "entrer",
  ) => void;
}

const NoeudArbreItem: FunctionComponent<NoeudArbreProps> = ({
  noeud,
  niveau,
  itemSelectionneId,
  onSelectionItem,
  estItemDesactive,
  afficherStatut,
  groupesOuverts,
  onToggleGroupe,
  onDeplacer,
}) => {
  const estGroupe = noeud.type === "GROUPE";
  const estSelectionne = noeud.id === itemSelectionneId;
  const estDesactive = estItemDesactive?.(noeud) ?? false;

  const titre = afficherStatut
    ? noeud.titreBrouillon || noeud.titre || "(sans titre)"
    : noeud.titre || "(sans titre)";

  return (
    <div>
      <div
        className={`group/noeud flex items-stretch transition-colors border-l-3 ${
          estDesactive
            ? "border-l-transparent"
            : estSelectionne
              ? "bg-blue-50 border-l-blue-600"
              : "hover:bg-gray-50 border-l-transparent"
        } ${afficherStatut && noeud.estMasque ? "opacity-50" : ""}`}
      >
        <button
          className={`flex-1 text-left py-2 flex items-center gap-2 min-w-0 ${
            estDesactive
              ? "cursor-default text-gray-500"
              : estSelectionne
                ? "text-blue-700 font-medium"
                : "text-gray-700"
          }`}
          disabled={estDesactive}
          onClick={() => onSelectionItem(noeud.id)}
          style={{ paddingLeft: `${niveau * 16 + 12}px` }}
          type="button"
        >
          {!estGroupe && (
            <span className="text-gray-400 shrink-0 text-xs">›</span>
          )}
          <span
            className={`text-sm truncate ${estGroupe ? "font-semibold" : ""}`}
          >
            {titre}
          </span>
          {afficherStatut && <BadgesStatut noeud={noeud} />}
        </button>
        {onDeplacer && (
          <div className="shrink-0 flex gap-0.5 opacity-0 group-hover/noeud:opacity-100 transition-opacity">
            <button
              className="p-0.5 text-gray-400 hover:text-gray-600"
              onClick={(event) => {
                event.stopPropagation();
                onDeplacer(noeud.id, "monter");
              }}
              title="Monter"
              type="button"
            >
              <span className="text-xs">&#x25B2;</span>
            </button>
            <button
              className="p-0.5 text-gray-400 hover:text-gray-600"
              onClick={(event) => {
                event.stopPropagation();
                onDeplacer(noeud.id, "descendre");
              }}
              title="Descendre"
              type="button"
            >
              <span className="text-xs">&#x25BC;</span>
            </button>
            {noeud.parentId && (
              <button
                className="p-0.5 text-gray-400 hover:text-gray-600"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeplacer(noeud.id, "sortir");
                }}
                title="Sortir du groupe"
                type="button"
              >
                <span className="text-xs">&#x25C0;</span>
              </button>
            )}
            <button
              className="p-0.5 text-gray-400 hover:text-gray-600"
              onClick={(event) => {
                event.stopPropagation();
                onDeplacer(noeud.id, "entrer");
              }}
              title="Entrer dans le groupe voisin"
              type="button"
            >
              <span className="text-xs">&#x25B6;</span>
            </button>
          </div>
        )}
        {estGroupe && noeud.enfants.length > 0 && (
          <button
            className="shrink-0 px-3 text-gray-400 hover:text-gray-600"
            onClick={() => onToggleGroupe(noeud.id)}
            title={groupesOuverts.has(noeud.id) ? "Replier" : "Déplier"}
            type="button"
          >
            <span
              className={`text-xs inline-block transition-transform ${groupesOuverts.has(noeud.id) ? "rotate-90" : ""}`}
            >
              ▸
            </span>
          </button>
        )}
      </div>

      {estGroupe &&
        noeud.enfants.length > 0 &&
        groupesOuverts.has(noeud.id) && (
          <div>
            {noeud.enfants.map((enfant) => (
              <NoeudArbreItem
                afficherStatut={afficherStatut}
                estItemDesactive={estItemDesactive}
                groupesOuverts={groupesOuverts}
                itemSelectionneId={itemSelectionneId}
                key={enfant.id}
                niveau={niveau + 1}
                noeud={enfant}
                onDeplacer={onDeplacer}
                onSelectionItem={onSelectionItem}
                onToggleGroupe={onToggleGroupe}
              />
            ))}
          </div>
        )}
    </div>
  );
};

interface ArborescenceCentreAideProps {
  arbre: NoeudArbre[];
  itemSelectionneId: string | null;
  onSelectionItem: (id: string) => void;
  estItemDesactive?: (noeud: NoeudArbre) => boolean;
  afficherStatut?: boolean;
  onDeplacer?: (
    id: string,
    action: "monter" | "descendre" | "sortir" | "entrer",
  ) => void;
}

export const ArborescenceCentreAide: FunctionComponent<
  ArborescenceCentreAideProps
> = ({
  arbre,
  itemSelectionneId,
  onSelectionItem,
  estItemDesactive,
  afficherStatut,
  onDeplacer,
}) => {
  const [groupesOuverts, setGroupesOuverts] = useState<Set<string>>(() => {
    const tousLesGroupes = new Set<string>();
    const collecterGroupes = (noeuds: NoeudArbre[]) => {
      for (const noeud of noeuds) {
        if (noeud.type === "GROUPE") {
          tousLesGroupes.add(noeud.id);
          collecterGroupes(noeud.enfants);
        }
      }
    };
    collecterGroupes(arbre);
    return tousLesGroupes;
  });

  const toggleGroupe = (id: string) => {
    setGroupesOuverts((previous) => {
      const suivant = new Set(previous);
      if (suivant.has(id)) {
        suivant.delete(id);
      } else {
        suivant.add(id);
      }
      return suivant;
    });
  };

  return (
    <div className="overflow-y-auto flex-1 py-2">
      {arbre.map((noeud) => (
        <NoeudArbreItem
          afficherStatut={afficherStatut}
          estItemDesactive={estItemDesactive}
          groupesOuverts={groupesOuverts}
          itemSelectionneId={itemSelectionneId}
          key={noeud.id}
          niveau={0}
          noeud={noeud}
          onDeplacer={onDeplacer}
          onSelectionItem={onSelectionItem}
          onToggleGroupe={toggleGroupe}
        />
      ))}
    </div>
  );
};
