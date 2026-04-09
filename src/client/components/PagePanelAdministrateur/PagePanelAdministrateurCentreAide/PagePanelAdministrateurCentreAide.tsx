import { FunctionComponent, useState } from "react";
import { EditeurCentreAide } from "@/components/_commons/EditeurRiche/EditeurCentreAide";
import {
  classesRenduContenuHtml,
  RenduContenuHtml,
} from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { Icone } from "@/components/_commons/Icone";
import { SavePleineIcon } from "@/components/_commons/Icones/SavePleineIcon";
import { SendIcon } from "@/components/_commons/Icones/SendIcon";
import { Delete1Icon } from "@/components/_commons/Icones/Delete1Icon";
import { EyeIcon } from "@/components/_commons/Icones/EyeIcon";
import { EyeOffIcon } from "@/components/_commons/Icones/EyeOffIcon";
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
    titreAffiche,
    setTitreAffiche,
    contenu,
    setContenu,
    sauvegarder,
    supprimer,
    publier,
    basculerVisibilite,
    aDesModificationsNonPubliees,
  } = useEditionCentreAide();

  const [afficherArbo, setAfficherArbo] = useState(true);
  const [afficherEditeurCol, setAfficherEditeurCol] = useState(true);
  const [afficherApercu, setAfficherApercu] = useState(true);

  if (estChargement) {
    return <p>Chargement...</p>;
  }

  const afficherEditeur = itemSelectionne !== undefined;
  const aContenu = contenu !== null;

  const toggleButtonClass = (actif: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
      actif
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
    }`;

  return (
    <div className="flex flex-col gap-2 h-[calc(100dvh-120px)]">
      <div className="flex gap-2">
        <button
          className={toggleButtonClass(afficherArbo)}
          onClick={() => setAfficherArbo((previous) => !previous)}
          type="button"
        >
          {afficherArbo ? "Masquer" : "Afficher"} l'arborescence
        </button>
        <button
          className={toggleButtonClass(afficherEditeurCol)}
          onClick={() => setAfficherEditeurCol((previous) => !previous)}
          type="button"
        >
          {afficherEditeurCol ? "Masquer" : "Afficher"} l'éditeur
        </button>
        <button
          className={toggleButtonClass(afficherApercu)}
          onClick={() => setAfficherApercu((previous) => !previous)}
          type="button"
        >
          {afficherApercu ? "Masquer" : "Afficher"} l'aperçu
        </button>
      </div>

      <div className="flex flex-1 min-h-0 bg-white border-gray-200 rounded-lg overflow-hidden">
        {afficherArbo && (
          <div className="w-[280px] shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
            <ArborescenceCentreAideAdmin
              arbre={arbre}
              itemSelectionneId={itemSelectionneId}
              onCreerGroupe={creerGroupe}
              onCreerPage={creerPage}
              onSelectionItem={selectionnerItem}
            />
          </div>
        )}

        {afficherEditeur ? (
          <>
            {afficherEditeurCol && (
              <div
                className="flex-1 flex flex-col overflow-hidden min-w-0"
                key={itemSelectionneId}
              >
                <div className="p-4 border-b border-gray-200 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    {itemSelectionne?.estPublie ? (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Publié
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Brouillon
                      </span>
                    )}
                    {aDesModificationsNonPubliees && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                        Modifications non publiées
                      </span>
                    )}
                    {itemSelectionne?.estMasque && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        Masqué
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom (arborescence)
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(event) => setTitre(event.target.value)}
                        placeholder="Titre de l'article"
                        type="text"
                        value={titre}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titre affiché (contenu)
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(event) =>
                          setTitreAffiche(event.target.value)
                        }
                        placeholder="Titre affiché dans le contenu de l'article"
                        type="text"
                        value={titreAffiche}
                      />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        className="p-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                        onClick={sauvegarder}
                        title="Sauvegarder le brouillon"
                        type="button"
                      >
                        <Icone
                          className="w-5 h-5 text-white"
                          icone={SavePleineIcon}
                        />
                      </button>
                      <button
                        className="p-2 text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={
                          !aDesModificationsNonPubliees &&
                          itemSelectionne?.estPublie === true
                        }
                        onClick={publier}
                        title="Publier"
                        type="button"
                      >
                        <Icone
                          className="w-5 h-5 text-white"
                          icone={SendIcon}
                        />
                      </button>
                      <button
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50"
                        onClick={basculerVisibilite}
                        title={
                          itemSelectionne?.estMasque
                            ? "Rendre visible"
                            : "Masquer"
                        }
                        type="button"
                      >
                        <Icone
                          className="w-5 h-5"
                          icone={
                            itemSelectionne?.estMasque ? EyeIcon : EyeOffIcon
                          }
                        />
                      </button>
                      {itemSelectionneId && (
                        <button
                          className="p-2 text-white bg-red-600 rounded hover:bg-red-700"
                          onClick={supprimer}
                          title="Supprimer"
                          type="button"
                        >
                          <Icone
                            className="w-5 h-5 text-white"
                            icone={Delete1Icon}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {aContenu ? (
                  <div className="flex-1 min-h-0 p-4 flex flex-col">
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
            )}

            {afficherApercu && aContenu && (
              <div className="flex-1 border-l border-gray-200 overflow-y-auto p-4">
                <h3 className="text-base font-bold mb-4">Aperçu</h3>
                <div className={classesRenduContenuHtml} key={contenu}>
                  <RenduContenuHtml html={contenu!} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Sélectionnez un article ou créez-en un nouveau.
          </div>
        )}
      </div>
    </div>
  );
};
