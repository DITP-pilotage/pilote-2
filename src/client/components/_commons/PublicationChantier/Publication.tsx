import { FunctionComponent } from "react";
import Alerte from "@/components/_commons/Alerte/Alerte";
import Titre from "@/components/_commons/Titre/Titre";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import usePublication from "./usePublication";
import PublicationFormulaire from "./PublicationFormulaire/PublicationFormulaire";
import PublicationProps from "./Publication.interface";
import PublicationHistorique from "./PublicationHistorique/PublicationHistorique";
import PublicationAffichage from "./PublicationAffichage/PublicationAffichage";

const Publication: FunctionComponent<PublicationProps> = ({
  caractéristiques,
  publicationInitiale,
  réformeId,
  maille,
  modeÉcriture,
  estInteractif,
  territoireCode,
}) => {
  const {
    publication,
    modeÉdition,
    alerte,
    afficherAlerteErreur,
    publicationCréée,
    activerLeModeÉdition,
    désactiverLeModeÉdition,
  } = usePublication(publicationInitiale);

  return (
    <section className="fr-px-0 fr-px-md-1w fr-py-2w">
      <Titre baliseHtml="h3" className="fr-h5 fr-mb-1w">
        {modeÉdition
          ? `Modifier : ${caractéristiques.libelléType}`
          : caractéristiques.libelléType}
      </Titre>
      {!!alerte && (
        <div className="fr-mb-2w">
          <Alerte titre={alerte.titre} type={alerte.type} />
        </div>
      )}
      {modeÉdition && modeÉcriture ? (
        <PublicationFormulaire
          annulationCallback={désactiverLeModeÉdition}
          caractéristiques={caractéristiques}
          contenuInitial={publication?.contenu}
          erreurCallback={afficherAlerteErreur}
          succèsCallback={publicationCréée}
          territoireCode={territoireCode}
        />
      ) : (
        <>
          <PublicationAffichage publication={publication} />
          {estInteractif ? (
            <div className="fr-grid-row fr-grid-row--right">
              <div className="fr-col-12 flex justify-end fr-mt-1w">
                {!!publication && (
                  <PublicationHistorique
                    entité={caractéristiques.entité}
                    maille={maille}
                    réformeId={réformeId}
                    territoireCode={territoireCode}
                    type={caractéristiques.type}
                  />
                )}
                {modeÉcriture ? (
                  <button
                    className="fr-btn fr-btn--secondary !ml-6 gap-2 rounded"
                    onClick={activerLeModeÉdition}
                    type="button"
                  >
                    <Icone icone={Icone1Icon} />
                    Modifier
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};

export default Publication;
