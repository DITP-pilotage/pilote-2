import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import ovoidBackground from "../../../../../public/dsfr/artwork/background/ovoid.svg";
import technicalError from "../../../../../public/dsfr/artwork/pictograms/system/technical-error.svg";
import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";

interface PageVideProps {
  titre: string;
}

const PageVide: FunctionComponent<PageVideProps> = ({ titre }) => {
  return (
    <div>
      <main>
        <div className="max-w-none overflow-hidden px-30 pb-24">
          <div className="flex flex-wrap py-8">
            <h1 className="my-auto">{titre}</h1>
            <Badge className="ml-6 my-auto bg-dsfr-purple-glycine-950 text-dsfr-purple-glycine-text">
              À venir
            </Badge>
          </div>
          <Bloc>
            <div className="flex flex-wrap items-center justify-center -m-2 lg:-m-3">
              <div className="w-full shrink-0 md:w-1/2 p-0 pr-8">
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
              <div className="w-full shrink-0 md:w-1/4 md:ml-[calc(100%/12)] p-0">
                <svg
                  aria-hidden="true"
                  className="h-auto w-full"
                  height="150"
                  viewBox="0 0 160 200"
                  width="160"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <use
                    className="fill-dsfr-grey-925"
                    href={`${ovoidBackground.src}#artwork-motif`}
                  />
                  <use
                    className="fill-dsfr-grey-1000"
                    href={`${ovoidBackground.src}#artwork-background`}
                  />
                  <g transform="translate(40, 60)">
                    <use
                      className="fill-dsfr-blue-france-950"
                      href={`${technicalError.src}#artwork-decorative`}
                    />
                    <use
                      className="fill-dsfr-red-marianne-main-472"
                      href={`${technicalError.src}#artwork-minor`}
                    />
                    <use
                      className="fill-dsfr-blue-france-sun-113"
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
