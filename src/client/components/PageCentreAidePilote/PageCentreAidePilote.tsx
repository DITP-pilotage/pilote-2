import { FunctionComponent } from "react";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { ContenuHtmlStyled } from "@/components/_commons/EditeurContenu3Colonnes/EditeurContenu3Colonnes.styled";
import { ArborescenceCentreAide } from "@/components/_commons/CentreAide/ArborescenceCentreAide";
import { NoeudArbre } from "@/components/_commons/CentreAide/types";
import { useLectureCentreAide } from "@/components/_commons/CentreAide/useLectureCentreAide";

const estGroupeSansContenu = (noeud: NoeudArbre) =>
  noeud.type === "GROUPE" && noeud.contenu === null;

export const PageCentreAidePilote: FunctionComponent = () => {
  const {
    arbre,
    itemSelectionneId,
    itemSelectionne,
    selectionnerItem,
    estChargement,
  } = useLectureCentreAide();

  if (estChargement) {
    return <p>Chargement...</p>;
  }

  const aContenu =
    itemSelectionne?.contenu !== null && itemSelectionne?.contenu !== undefined;

  return (
    <main className="px-48 py-4">
      <div className="flex bg-white border border-gray-200 rounded-lg">
        <div className="w-[280px] shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
          <ArborescenceCentreAide
            arbre={arbre}
            estItemDesactive={estGroupeSansContenu}
            itemSelectionneId={itemSelectionneId}
            onSelectionItem={selectionnerItem}
          />
        </div>

        {itemSelectionne ? (
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{itemSelectionne.titre}</h2>
            {aContenu ? (
              <ContenuHtmlStyled>
                <RenduContenuHtml html={itemSelectionne.contenu!} />
              </ContenuHtmlStyled>
            ) : (
              <p className="text-gray-400 text-sm">
                Ce groupe ne contient pas de contenu.
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Sélectionnez un article pour afficher son contenu.
          </div>
        )}
      </div>
    </main>
  );
};
