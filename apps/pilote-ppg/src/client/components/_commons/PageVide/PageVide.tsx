import "@gouvfr/dsfr/dist/component/badge/badge.min.css";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import ovoidBackground from "@gouvfr/dsfr/dist/artwork/background/ovoid.svg";
import technicalError from "@gouvfr/dsfr/dist/artwork/pictograms/system/technical-error.svg";
import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";

interface PageVideProps {
  titre: string;
}

const PageVide: FunctionComponent<PageVideProps> = ({ titre }) => {
  return (
    <div>
      <main>
        <div className="fr-px-15w fr-pb-12w fr-container--fluid">
          <div className="fr-grid-row fr-py-4w">
            <h1 className="my-auto">{titre}</h1>
            <Badge className="ml-6 my-auto bg-dsfr-purple-glycine-950 text-dsfr-purple-glycine-text">
              À venir
            </Badge>
          </div>
          <Bloc>
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
              <div className="fr-p-0 fr-pr-4w fr-col-12 fr-col-md-6">
                <p className="text-h4 md:text-h4-md font-bold mb-6 text-dsfr-grey-50">
                  Service bientôt disponible
                </p>
                <p>
                  Merci de bien vouloir revenir ultérieurement, vous serez
                  bientôt en mesure d'accéder au service.
                  <br />
                  <br />
                  Si vous avez besoin d'une aide immédiate, merci de nous
                  contacter.
                </p>
                <Button asChild variant="secondary">
                  <a href="mailto:pilote.ditp@modernisation.gouv.fr">
                    Contactez-nous
                  </a>
                </Button>
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
                      href={`${technicalError.src}#artwork-decorative`}
                    />
                    <use
                      className="fr-artwork-minor"
                      href={`${technicalError.src}#artwork-minor`}
                    />
                    <use
                      className="fr-artwork-major"
                      href={`${technicalError.src}#artwork-major`}
                    />
                  </g>
                </svg>
              </div>
            </div>
          </Bloc>
        </div>
      </main>
    </div>
  );
};

export default PageVide;
