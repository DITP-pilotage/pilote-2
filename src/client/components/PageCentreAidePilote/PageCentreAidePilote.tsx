import { FunctionComponent, useEffect, useMemo, useRef } from "react";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { ArborescenceCentreAide } from "@/components/_commons/CentreAide/ArborescenceCentreAide";
import { NoeudArbre } from "@/components/_commons/CentreAide/types";
import { useLectureCentreAide } from "@/components/_commons/CentreAide/useLectureCentreAide";

const estGroupeSansContenu = (noeud: NoeudArbre) =>
  noeud.type === "GROUPE" && noeud.contenu === null;

const filtrerArbrePublie = (noeuds: NoeudArbre[]): NoeudArbre[] => {
  return noeuds
    .filter((noeud) => noeud.estPublie && !noeud.estMasque)
    .map((noeud) => ({
      ...noeud,
      enfants: filtrerArbrePublie(noeud.enfants),
    }));
};

const trouverPremierePage = (noeuds: NoeudArbre[]): NoeudArbre | undefined => {
  for (const noeud of noeuds) {
    if (!estGroupeSansContenu(noeud)) return noeud;
    const trouvee = trouverPremierePage(noeud.enfants);
    if (trouvee) return trouvee;
  }
  return undefined;
};

export const PageCentreAidePilote: FunctionComponent = () => {
  const {
    arbre,
    itemSelectionneId,
    itemSelectionne,
    selectionnerItem,
    estChargement,
  } = useLectureCentreAide();

  const arbrePublie = useMemo(() => filtrerArbrePublie(arbre), [arbre]);
  const aAutoSelectionne = useRef(false);

  useEffect(() => {
    if (!estChargement && arbrePublie.length > 0 && !aAutoSelectionne.current) {
      aAutoSelectionne.current = true;
      const premiere = trouverPremierePage(arbrePublie);
      if (premiere) {
        selectionnerItem(premiere.id);
      }
    }
  }, [estChargement, arbrePublie, selectionnerItem]);

  if (estChargement) {
    return <p>Chargement...</p>;
  }

  const aContenu =
    itemSelectionne?.contenu !== null && itemSelectionne?.contenu !== undefined;

  return (
    <main className="px-48 md:px-96 py-4">
      <div className="flex gap-4">
        <div className="w-[280px] shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-base font-bold border-b border-gray-200">
            Centre d'aide PILOTE
          </h2>
          <ArborescenceCentreAide
            arbre={arbrePublie}
            estItemDesactive={estGroupeSansContenu}
            itemSelectionneId={itemSelectionneId}
            onSelectionItem={selectionnerItem}
          />
        </div>

        {itemSelectionne ? (
          <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">{itemSelectionne.titre}</h2>
            {aContenu ? (
              <div className="[&_p]:mb-0 [&_a]:text-primary [&_h4]:my-2 [&_hr]:!my-2">
                <RenduContenuHtml html={itemSelectionne.contenu!} />
              </div>
            ) : (
              <p className="text-gray-400 text-sm">
                Ce groupe ne contient pas de contenu.
              </p>
            )}
          </div>
        ) : (
          <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-400 text-sm">
            Sélectionnez un article pour afficher son contenu.
          </div>
        )}
      </div>
    </main>
  );
};
