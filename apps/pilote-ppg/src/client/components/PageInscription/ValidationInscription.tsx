import "@gouvfr/dsfr/dist/component/badge/badge.min.css";
import ovoidBackground from "@gouvfr/dsfr/dist/artwork/background/ovoid.svg";
import success from "@gouvfr/dsfr/dist/artwork/pictograms/system/success.svg";
import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";

const ValidationInscription: FunctionComponent = () => {
  return (
    <div className="fr-px-15w fr-pb-12w fr-container--fluid">
      <div className="fr-grid-row fr-py-4w">
        <h1 className="my-auto">
          Nous vous remercions pour votre inscription !
        </h1>
      </div>
      <Bloc>
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
          <div className="fr-p-0 fr-pr-4w fr-col-12 fr-col-md-6">
            <p className="text-h4 md:text-h4-md font-bold mb-6 text-dsfr-grey-50">
              Votre inscription à l'infolettre est validée
            </p>
            <p>
              Vous recevrez désormais régulièrement les dernières actualités
              concernant PILOTE. Si vous ne recevez pas nos messages, pensez à
              vérifier vos courriers indésirables ou à contacter
              pilote.ditp@modernisation.gouv.fr
            </p>
            <p>Merci de votre intérêt !</p>
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
                  href={`${success.src}#artwork-decorative`}
                />
                <use
                  className="fr-artwork-minor"
                  href={`${success.src}#artwork-minor`}
                />
                <use
                  className="fr-artwork-major"
                  href={`${success.src}#artwork-major`}
                />
              </g>
            </svg>
          </div>
        </div>
      </Bloc>
    </div>
  );
};

export default ValidationInscription;
