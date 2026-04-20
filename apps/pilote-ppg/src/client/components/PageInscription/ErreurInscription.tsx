import "@gouvfr/dsfr/dist/component/badge/badge.min.css";
import ovoidBackground from "@gouvfr/dsfr/dist/artwork/background/ovoid.svg";
import error from "@gouvfr/dsfr/dist/artwork/pictograms/system/error.svg";
import { FunctionComponent } from "react";
import Titre from "@/components/_commons/Titre/Titre";
import Bloc from "@/components/_commons/Bloc/Bloc";

const ErreurInscription: FunctionComponent = () => {
  return (
    <div className="fr-px-15w fr-pb-12w fr-container--fluid">
      <div className="fr-grid-row fr-py-4w">
        <Titre baliseHtml="h1" className="fr-my-auto">
          Erreur lors de votre inscription à l'infolettre
        </Titre>
      </div>
      <Bloc>
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
          <div className="fr-p-0 fr-pr-4w fr-col-12 fr-col-md-6">
            <p className="fr-h4">
              Une erreur est survenue lors de votre inscription. Votre demande
              n'a pas pu être enregistrée.
            </p>
            <p>
              Veuillez réessayer dans quelques instants. Si le problème
              persiste, contactez pilote.ditp@modernisation.gouv.fr
            </p>
            <p>Merci de votre compréhension.</p>
          </div>
          <div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 fr-p-0">
            <svg
              aria-hidden="true"
              className="fr-responsive-img fr-artwork"
              height="150"
              viewBox="0 0 160 200"
              width="160"
              xmlns="http://www.w3.org/2000/svg"
            >
              <use
                className="fr-artwork-motif"
                href={`${ovoidBackground.src}#artwork-motif`}
              />
              <use
                className="fr-artwork-background"
                href={`${ovoidBackground.src}#artwork-background`}
              />
              <g transform="translate(40, 60)">
                <use
                  className="fr-artwork-decorative"
                  href={`${error.src}#artwork-decorative`}
                />
                <use
                  className="fr-artwork-minor"
                  href={`${error.src}#artwork-minor`}
                />
                <use
                  className="fr-artwork-major"
                  href={`${error.src}#artwork-major`}
                />
              </g>
            </svg>
          </div>
        </div>
      </Bloc>
    </div>
  );
};

export default ErreurInscription;
