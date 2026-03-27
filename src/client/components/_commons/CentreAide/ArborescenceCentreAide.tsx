import { FunctionComponent } from "react";
import { NoeudArbre, aDesModificationsNonPubliees } from "./types";

const IndicateurSelection: FunctionComponent<{
  estSelectionne: boolean;
  estDesactive: boolean;
}> = ({ estSelectionne, estDesactive }) => (
  <span
    className={`w-[10px] h-[10px] shrink-0 rounded-full border-2 transition-colors ${
      estDesactive
        ? "border-gray-300 bg-gray-300"
        : estSelectionne
          ? "border-blue-600 bg-blue-600"
          : "border-gray-300 bg-white"
    }`}
  />
);

const BadgesStatut: FunctionComponent<{ noeud: NoeudArbre }> = ({ noeud }) => {
  const estBrouillon = !noeud.estPublie;
  const aModifsNonPubliees = aDesModificationsNonPubliees(noeud);

  return (
    <div className="flex gap-1 shrink-0 ml-auto">
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

  return (
    <div>
      <button
        className={`w-full text-left py-2 pr-3 flex items-center gap-2 transition-colors ${
          estDesactive
            ? "cursor-default text-gray-700"
            : estSelectionne
              ? "bg-blue-50 text-blue-700"
              : "hover:bg-gray-50 text-gray-700"
        } ${afficherStatut && noeud.estMasque ? "opacity-50" : ""}`}
        disabled={estDesactive}
        onClick={() => onSelectionItem(noeud.id)}
        style={{ paddingLeft: `${niveau * 20 + 12}px` }}
        type="button"
      >
        <IndicateurSelection
          estDesactive={estDesactive}
          estSelectionne={estSelectionne}
        />
        <span
          className={`text-sm truncate ${estGroupe ? "font-semibold" : ""}`}
        >
          {afficherStatut
            ? noeud.titreBrouillon || noeud.titre || "(sans titre)"
            : noeud.titre || "(sans titre)"}
        </span>
        {estGroupe && noeud.contenu !== null && (
          <span className="text-xs text-gray-400 shrink-0">+</span>
        )}
        {afficherStatut && <BadgesStatut noeud={noeud} />}
      </button>

      {estGroupe && noeud.enfants.length > 0 && (
        <div className="relative">
          <span
            className="absolute top-0 bottom-0 w-px bg-gray-200"
            style={{ left: `${niveau * 20 + 18}px` }}
          />
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
    <div className="overflow-y-auto flex-1">
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
