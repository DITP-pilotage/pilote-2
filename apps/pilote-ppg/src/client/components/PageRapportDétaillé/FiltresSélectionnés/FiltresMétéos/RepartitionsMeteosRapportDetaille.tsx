import { FunctionComponent } from "react";
import { parseAsString, useQueryState } from "nuqs";
import {
  libellesMeteos,
  meteosSaisissables,
} from "@/shared/meteo/Meteo.interface";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { RepartitionMeteoContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";
import { clsxm } from "@/utils/clsxm";

interface RepartitionsMeteosRapportDetailleProps {
  repartitionMeteos: RepartitionMeteoContrat;
}

const RepartitionsMeteosRapportDetaille: FunctionComponent<
  RepartitionsMeteosRapportDetailleProps
> = ({ repartitionMeteos }) => {
  const [meteos] = useQueryState(
    "meteos",
    parseAsString.withDefault("").withOptions({
      shallow: false,
      clearOnDefault: true,
      history: "push",
    }),
  );

  return (
    <ul className="fr-grid-row fr-mx-n3v list-none">
      {meteosSaisissables.map((meteo) => (
        <li
          className="fr-col-3 fr-p-2v max-[80rem]:p-0.5"
          key={libellesMeteos[meteo]}
          title={libellesMeteos[meteo]}
        >
          <button
            className={clsxm(
              "h-full shadow-lg p-2 border !border-dsfr-grey-925 rounded flex flex-col items-center",
              {
                "!border-primary": meteos.includes(meteo),
              },
            )}
            disabled
            type="button"
          >
            <MeteoPicto meteo={meteo} />
            <p className="text-h1 md:text-h1-md font-bold mb-0 text-primary">
              {repartitionMeteos[meteo]}
            </p>
            <p className="fr-mb-0 break-keep text-dsfr-grey-50 max-[80rem]:!text-xs">
              {libellesMeteos[meteo]}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default RepartitionsMeteosRapportDetaille;
