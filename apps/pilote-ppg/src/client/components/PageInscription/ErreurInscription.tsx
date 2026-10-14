import ovoidBackground from "../../../../public/dsfr/artwork/background/ovoid.svg";
import error from "../../../../public/dsfr/artwork/pictograms/system/error.svg";
import { FunctionComponent } from "react";
import Bloc from "@/components/_commons/Bloc/Bloc";

const ErreurInscription: FunctionComponent = () => {
  return (
    <div className="max-w-none overflow-hidden px-30 pb-24">
      <div className="flex flex-wrap py-8">
        <h1 className="my-auto">
          Erreur lors de votre inscription à l'infolettre
        </h1>
      </div>
      <Bloc>
        <div className="flex flex-wrap items-center justify-center -m-2 lg:-m-3">
          <div className="w-full shrink-0 md:w-1/2 p-0 pr-8">
            <p className="text-h4 md:text-h4-md font-bold mb-6 text-dsfr-grey-50">
              Une erreur est survenue lors de votre inscription. Votre demande
              n'a pas pu être enregistrée.
            </p>
            <p>
              Veuillez réessayer dans quelques instants. Si le problème
              persiste, contactez pilote.ditp@modernisation.gouv.fr
            </p>
            <p>Merci de votre compréhension.</p>
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
                  href={`${error.src}#artwork-decorative`}
                />
                <use
                  className="fill-dsfr-red-marianne-main-472"
                  href={`${error.src}#artwork-minor`}
                />
                <use
                  className="fill-dsfr-blue-france-sun-113"
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
