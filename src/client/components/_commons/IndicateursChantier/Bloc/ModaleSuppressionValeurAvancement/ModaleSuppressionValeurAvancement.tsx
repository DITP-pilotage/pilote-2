import { FunctionComponent } from "react";
import { useRouter } from "next/router";
import Modale from "@/components/_commons/Modale/Modale";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";

import { useModaleSuppressionValeurAvancement } from "@/components/_commons/IndicateursChantier/Bloc/ModaleSuppressionValeurAvancement/useModaleSuppressionValeurAvancement";
import Titre from "@/components/_commons/Titre/Titre";

export const ModaleSuppressionValeurAvancement: FunctionComponent<{
  indicateur: Indicateur;
  generatedHTMLID: string;
  territoireCode: string;
}> = ({ indicateur, generatedHTMLID, territoireCode }) => {
  const router = useRouter();

  const { supprimerPropositionValeurAvancement, estSupprime } =
    useModaleSuppressionValeurAvancement({
      indicateur,
      territoireCode,
    });

  return (
    <Modale
      fermetureCallback={() => {
        router.replace(router.asPath, undefined, { scroll: false });
      }}
      idHtml={generatedHTMLID}
      tailleModale="lg"
    >
      {!estSupprime ? (
        <>
          <Titre baliseHtml="h1" className="fr-modal__title fr-mb-1w">
            Suppression de la proposition
          </Titre>
          <p>
            Vous êtes sur le point de supprimer la proposition de valeur
            d'avancement du territoire.
          </p>
          <div className="w-full flex justify-end fr-mt-2w">
            <button
              aria-controls={generatedHTMLID}
              className="fr-btn fr-btn--secondary fr-mr-2w"
              title="Fermer la fenêtre modale"
              type="button"
            >
              Annuler
            </button>
            <button
              className="fr-btn"
              onClick={() => supprimerPropositionValeurAvancement()}
              type="button"
            >
              Supprimer la proposition
            </button>
          </div>
        </>
      ) : (
        <div className="fr-alert fr-alert--success fr-mt-2w">
          <h3 className="fr-alert__title">
            La proposition de valeur d'avancement a correctement été supprimée
          </h3>
          <span>
            La suppression sera effective dans le tableau des indicateurs dans
            une heure. Veuillez noter que, dans cet intervalle, il n'est pas
            possible de faire une autre proposition pour cet indicateur.
          </span>
        </div>
      )}
    </Modale>
  );
};
