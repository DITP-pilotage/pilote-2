import { FunctionComponent, useState } from "react";
import { ArbreCentreAideDnd } from "@/components/_commons/CentreAide/editeur/ArbreCentreAideDnd";
import { ArticleCentreAideContrat } from "@/server/parametrage-centre-aide/app/contrats/ArticleCentreAideContrat";

interface ArborescenceCentreAideAdminProps {
  articles: ArticleCentreAideContrat[];
  itemSelectionneId: string | null;
  onSelectionItem: (id: string) => void;
  onCreerGroupe: (avecContenu: boolean) => void;
  onCreerPage: () => void;
  onDeplacer: (
    id: string,
    cible: { parentId: string | null; index: number },
  ) => void;
}

export const ArborescenceCentreAideAdmin: FunctionComponent<
  ArborescenceCentreAideAdminProps
> = ({
  articles,
  itemSelectionneId,
  onSelectionItem,
  onCreerGroupe,
  onCreerPage,
  onDeplacer,
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

      <ArbreCentreAideDnd
        articles={articles}
        onDeplacer={onDeplacer}
        onSelectionner={onSelectionItem}
        selectionneId={itemSelectionneId}
      />
    </div>
  );
};
