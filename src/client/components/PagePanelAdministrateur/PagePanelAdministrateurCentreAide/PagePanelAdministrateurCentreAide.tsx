import { FunctionComponent } from "react";
import { EditeurCentreAide } from "@/components/_commons/EditeurRiche/EditeurCentreAide";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { ContenuHtmlStyled } from "@/components/_commons/EditeurContenu3Colonnes/EditeurContenu3Colonnes.styled";
import { ArborescenceCentreAideAdmin } from "./ArborescenceCentreAide";
import { useEditionCentreAide } from "./useEditionCentreAide";

export const PagePanelAdministrateurCentreAide: FunctionComponent = () => {
  const {
    arbre,
    itemSelectionneId,
    itemSelectionne,
    selectionnerItem,
    creerGroupe,
    creerPage,
    estChargement,
    titre,
    setTitre,
    contenu,
    setContenu,
    sauvegarder,
    supprimer,
  } = useEditionCentreAide();

  if (estChargement) {
    return <p>Chargement...</p>;
  }

  const afficherEditeur = itemSelectionne !== undefined;
  const aContenu = contenu !== null;

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white border-gray-200 rounded-lg">
      <div className="w-[280px] shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
        <ArborescenceCentreAideAdmin
          arbre={arbre}
          itemSelectionneId={itemSelectionneId}
          onCreerGroupe={creerGroupe}
          onCreerPage={creerPage}
          onSelectionItem={selectionnerItem}
        />
      </div>

      {afficherEditeur ? (
        <>
          <div
            className="flex-1 flex flex-col overflow-hidden min-w-0"
            key={itemSelectionneId}
          >
            <div className="p-4 border-b border-gray-200 flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(event) => setTitre(event.target.value)}
                  placeholder="Titre de l'article"
                  type="text"
                  value={titre}
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  onClick={sauvegarder}
                  type="button"
                >
                  Sauvegarder
                </button>
                {itemSelectionneId && (
                  <button
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                    onClick={supprimer}
                    type="button"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
            {aContenu ? (
              <div className="flex-1 overflow-y-auto p-4">
                <EditeurCentreAide
                  contenu={contenu}
                  onChange={setContenu}
                  placeholder="Saisissez votre contenu..."
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Ce groupe n'a pas de contenu éditable.
              </div>
            )}
          </div>

          {aContenu && (
            <div className="flex-1 border-l border-gray-200 overflow-y-auto p-4">
              <h3 className="text-base font-bold mb-4">Aperçu</h3>
              <ContenuHtmlStyled key={contenu}>
                <RenduContenuHtml html={contenu!} />
              </ContenuHtmlStyled>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Sélectionnez un article ou créez-en un nouveau.
        </div>
      )}
    </div>
  );
};
