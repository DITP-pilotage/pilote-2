import { FunctionComponent, useEffect, useMemo, useRef } from "react";
import {
  classesRenduContenuHtml,
  RenduContenuHtml,
} from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { ArborescenceCentreAide } from "@/components/_commons/CentreAide/ArborescenceCentreAide";
import { NoeudArbre } from "@/components/_commons/CentreAide/types";
import { LARGEUR_ARTICLE } from "@/components/_commons/CentreAide/miseEnPageArticle";
import { clsxm } from "@/utils/clsxm";
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
    if (
      !estChargement &&
      arbrePublie.length > 0 &&
      !aAutoSelectionne.current &&
      !itemSelectionneId
    ) {
      aAutoSelectionne.current = true;
      const premiere = trouverPremierePage(arbrePublie);
      if (premiere) {
        selectionnerItem(premiere.id);
      }
    }
  }, [estChargement, arbrePublie, selectionnerItem, itemSelectionneId]);

  if (estChargement) {
    return <p>Chargement...</p>;
  }

  const aContenu =
    itemSelectionne?.contenu !== null && itemSelectionne?.contenu !== undefined;

  return (
    // La mise en page teinte tout <main> : il doit rester pleine largeur, sinon
    // la teinte se reduit a une bande centrale.
    <main>
      <div className="mx-auto flex min-h-[calc(100dvh-18rem)] max-w-screen-xl gap-6 px-6 py-8">
        <nav className="flex w-[280px] shrink-0 flex-col overflow-hidden border border-dsfr-grey-900 bg-white">
          <h2 className="border-b border-dsfr-grey-900 px-4 py-3 text-[15px] font-bold text-dsfr-grey-50 fr-mb-0">
            Centre d&apos;aide PILOTE
          </h2>
          <ArborescenceCentreAide
            arbre={arbrePublie}
            estItemDesactive={estGroupeSansContenu}
            itemSelectionneId={itemSelectionneId}
            onSelectionItem={selectionnerItem}
          />
        </nav>

        {itemSelectionne ? (
          <article className="min-w-0 flex-1 overflow-y-auto border border-dsfr-grey-900 bg-white px-8 py-10 sm:px-12">
            <div className={clsxm("w-full", LARGEUR_ARTICLE)}>
              <h1 className="text-[26px] leading-8 font-bold text-dsfr-grey-50 fr-mb-0">
                {itemSelectionne.titreAffiche || itemSelectionne.titre}
              </h1>
              {aContenu ? (
                <div className={clsxm("mt-6", classesRenduContenuHtml)}>
                  <RenduContenuHtml html={itemSelectionne.contenu!} />
                </div>
              ) : (
                <p className="mt-6 text-[15px] leading-6 text-dsfr-mention-grey fr-mb-0">
                  Cette rubrique regroupe les articles ci-contre. Choisissez-en
                  un pour le lire.
                </p>
              )}
            </div>
          </article>
        ) : (
          <article className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 border border-dsfr-grey-900 bg-white px-8 text-center">
            <p className="text-[15px] font-medium text-dsfr-grey-50 fr-mb-0">
              Aucun article ouvert
            </p>
            <p className="text-[15px] leading-6 text-dsfr-mention-grey fr-mb-0">
              Choisissez un article dans le sommaire à gauche.
            </p>
          </article>
        )}
      </div>
    </main>
  );
};
