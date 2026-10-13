import ovoidBackground from "../../../../../public/dsfr/artwork/background/ovoid.svg";
import technicalError from "../../../../../public/dsfr/artwork/pictograms/system/technical-error.svg";
import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";

interface PageErreurProps {
  titre: string;
  sousTitre: string;
  message: string;
}

const PageErreur: FunctionComponent<PageErreurProps> = ({
  titre,
  sousTitre,
  message,
}) => {
  return (
    <div className="bg-dsfr-alt-blue-france">
      <main>
        <div className="px-30 pb-24 fr-container--fluid">
          <div className="fr-grid-row py-8">
            <h1 className="my-auto text-primary">{titre}</h1>
          </div>
          <Bloc>
            <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
              <div className="p-0 pr-8 fr-col-12 fr-col-md-6">
                <p className="text-h4 md:text-h4-md font-bold mb-6 text-dsfr-grey-50">
                  {sousTitre}
                </p>
                <p>{message}</p>
              </div>
              <div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 p-0">
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

export default PageErreur;
