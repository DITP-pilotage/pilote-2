import { FunctionComponent, useState } from "react";
import { NoeudArbre } from "./useEditionCentreAide";

interface NoeudArbreProps {
  noeud: NoeudArbre;
  niveau: number;
  itemSelectionneId: string | null;
  onSelectionItem: (id: string) => void;
  groupesOuverts: Set<string>;
  onToggleGroupe: (id: string) => void;
}

const NoeudArbreItem: FunctionComponent<NoeudArbreProps> = ({
  noeud,
  niveau,
  itemSelectionneId,
  onSelectionItem,
  groupesOuverts,
  onToggleGroupe,
}) => {
  const estGroupe = noeud.type === "GROUPE";
  const estOuvert = groupesOuverts.has(noeud.id);
  const estSelectionne = noeud.id === itemSelectionneId;

  return (
    <div>
      <button
        className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors hover:bg-gray-50 ${
          estSelectionne ? "bg-blue-50 border-l-[3px] border-l-blue-600" : ""
        }`}
        onClick={() => {
          onSelectionItem(noeud.id);
          if (estGroupe) {
            onToggleGroupe(noeud.id);
          }
        }}
        style={{ paddingLeft: `${niveau * 16 + 12}px` }}
        type="button"
      >
        {estGroupe && (
          <svg
            className={`w-3 h-3 shrink-0 transition-transform ${estOuvert ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 5l7 7-7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        )}
        {!estGroupe && <span className="w-3 shrink-0" />}
        <span
          className={`text-sm truncate ${estGroupe ? "font-semibold" : ""}`}
        >
          {noeud.titre || "(sans titre)"}
        </span>
        {estGroupe && noeud.contenu !== null && (
          <span className="text-xs text-gray-400 shrink-0">+</span>
        )}
      </button>

      {estGroupe && estOuvert && noeud.enfants.length > 0 && (
        <div>
          {noeud.enfants.map((enfant) => (
            <NoeudArbreItem
              groupesOuverts={groupesOuverts}
              itemSelectionneId={itemSelectionneId}
              key={enfant.id}
              niveau={niveau + 1}
              noeud={enfant}
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
  onCreerGroupe: (avecContenu: boolean) => void;
  onCreerPage: () => void;
  groupesOuverts: Set<string>;
  onToggleGroupe: (id: string) => void;
}

export const ArborescenceCentreAide: FunctionComponent<
  ArborescenceCentreAideProps
> = ({
  arbre,
  itemSelectionneId,
  onSelectionItem,
  onCreerGroupe,
  onCreerPage,
  groupesOuverts,
  onToggleGroupe,
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
            groupesOuverts={groupesOuverts}
            itemSelectionneId={itemSelectionneId}
            key={noeud.id}
            niveau={0}
            noeud={noeud}
            onSelectionItem={onSelectionItem}
            onToggleGroupe={onToggleGroupe}
          />
        ))}
      </div>
    </div>
  );
};
