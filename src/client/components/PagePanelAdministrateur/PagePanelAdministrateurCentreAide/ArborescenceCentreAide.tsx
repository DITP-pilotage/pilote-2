import { FunctionComponent, useState } from "react";
import { NoeudArbre } from "./useEditionCentreAide";

interface NoeudArbreProps {
  noeud: NoeudArbre;
  niveau: number;
  itemSelectionneId: string | null;
  onSelectionItem: (id: string) => void;
}

const IndicateurSelection: FunctionComponent<{
  estSelectionne: boolean;
}> = ({ estSelectionne }) => (
  <span
    className={`w-[10px] h-[10px] shrink-0 rounded-full border-2 transition-colors ${
      estSelectionne
        ? "border-blue-600 bg-blue-600"
        : "border-gray-300 bg-white"
    }`}
  />
);

const NoeudArbreItem: FunctionComponent<NoeudArbreProps> = ({
  noeud,
  niveau,
  itemSelectionneId,
  onSelectionItem,
}) => {
  const estGroupe = noeud.type === "GROUPE";
  const estSelectionne = noeud.id === itemSelectionneId;

  return (
    <div>
      <button
        className={`w-full text-left py-2 pr-3 flex items-center gap-2 transition-colors ${
          estSelectionne
            ? "bg-blue-50 text-blue-700"
            : "hover:bg-gray-50 text-gray-700"
        }`}
        onClick={() => onSelectionItem(noeud.id)}
        style={{ paddingLeft: `${niveau * 20 + 12}px` }}
        type="button"
      >
        <IndicateurSelection estSelectionne={estSelectionne} />
        <span
          className={`text-sm truncate ${estGroupe ? "font-semibold text-gray-900" : ""}`}
        >
          {noeud.titre || "(sans titre)"}
        </span>
        {estGroupe && noeud.contenu !== null && (
          <span className="text-xs text-gray-400 shrink-0">+</span>
        )}
      </button>

      {estGroupe && noeud.enfants.length > 0 && (
        <div className="relative">
          <span
            className="absolute top-0 bottom-0 w-px bg-gray-200"
            style={{ left: `${niveau * 20 + 18}px` }}
          />
          {noeud.enfants.map((enfant) => (
            <NoeudArbreItem
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
  onCreerGroupe: (avecContenu: boolean) => void;
  onCreerPage: () => void;
}

export const ArborescenceCentreAide: FunctionComponent<
  ArborescenceCentreAideProps
> = ({
  arbre,
  itemSelectionneId,
  onSelectionItem,
  onCreerGroupe,
  onCreerPage,
}) => {
  const [menuCreationGroupeOuvert, setMenuCreationGroupeOuvert] =
    useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 flex gap-2">
        <div className="relative flex-1">
          <button
            className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            onClick={() =>
              setMenuCreationGroupeOuvert(!menuCreationGroupeOuvert)
            }
            type="button"
          >
            Nouveau groupe
          </button>
          {menuCreationGroupeOuvert && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg z-10">
              <button
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50"
                onClick={() => {
                  onCreerGroupe(false);
                  setMenuCreationGroupeOuvert(false);
                }}
                type="button"
              >
                Sans contenu
              </button>
              <button
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-t border-gray-100"
                onClick={() => {
                  onCreerGroupe(true);
                  setMenuCreationGroupeOuvert(false);
                }}
                type="button"
              >
                Avec contenu
              </button>
            </div>
          )}
        </div>
        <button
          className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          onClick={onCreerPage}
          type="button"
        >
          Nouvelle page
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {arbre.map((noeud) => (
          <NoeudArbreItem
            itemSelectionneId={itemSelectionneId}
            key={noeud.id}
            niveau={0}
            noeud={noeud}
            onSelectionItem={onSelectionItem}
          />
        ))}
      </div>
    </div>
  );
};
