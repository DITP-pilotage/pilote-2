import { FunctionComponent } from "react";
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
}

const NoeudArbreItem: FunctionComponent<NoeudArbreProps> = ({
  noeud,
  niveau,
  itemSelectionneId,
  onSelectionItem,
  estItemDesactive,
  afficherStatut,
}) => {
  const estGroupe = noeud.type === "GROUPE";
  const estSelectionne = noeud.id === itemSelectionneId;
  const estDesactive = estItemDesactive?.(noeud) ?? false;

  const titre = afficherStatut
    ? noeud.titreBrouillon || noeud.titre || "(sans titre)"
    : noeud.titre || "(sans titre)";

  return (
    <div>
      <button
        className={`w-full text-left py-2 pr-3 flex items-center gap-2 transition-colors border-l-3 ${
          estDesactive
            ? "cursor-default text-gray-500 border-l-transparent"
            : estSelectionne
              ? "bg-blue-50 text-blue-700 border-l-blue-600 font-medium"
              : "hover:bg-gray-50 text-gray-700 border-l-transparent"
        } ${afficherStatut && noeud.estMasque ? "opacity-50" : ""}`}
        disabled={estDesactive}
        onClick={() => onSelectionItem(noeud.id)}
        style={{ paddingLeft: `${niveau * 16 + 12}px` }}
        type="button"
      >
        {estGroupe ? (
          <span className="text-gray-400 shrink-0 text-xs">
            {noeud.enfants.length > 0 ? "▸" : "▹"}
          </span>
        ) : (
          <span className="text-gray-400 shrink-0 text-xs">›</span>
        )}
        <span
          className={`text-sm truncate ${estGroupe ? "font-semibold" : ""}`}
        >
          {titre}
        </span>
        {afficherStatut && <BadgesStatut noeud={noeud} />}
      </button>

      {estGroupe && noeud.enfants.length > 0 && (
        <div>
          {noeud.enfants.map((enfant) => (
            <NoeudArbreItem
              afficherStatut={afficherStatut}
              estItemDesactive={estItemDesactive}
              itemSelectionneId={itemSelectionneId}
              key={enfant.id}
              niveau={niveau + 1}
              noeud={enfant}
              onSelectionItem={onSelectionItem}
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
}

export const ArborescenceCentreAide: FunctionComponent<
  ArborescenceCentreAideProps
> = ({
  arbre,
  itemSelectionneId,
  onSelectionItem,
  estItemDesactive,
  afficherStatut,
}) => {
  return (
    <div className="overflow-y-auto flex-1 py-2">
      {arbre.map((noeud) => (
        <NoeudArbreItem
          afficherStatut={afficherStatut}
          estItemDesactive={estItemDesactive}
          itemSelectionneId={itemSelectionneId}
          key={noeud.id}
          niveau={0}
          noeud={noeud}
          onSelectionItem={onSelectionItem}
        />
      ))}
    </div>
  );
};
