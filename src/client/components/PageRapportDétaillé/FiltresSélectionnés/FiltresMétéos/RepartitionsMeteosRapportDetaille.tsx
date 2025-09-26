import { FunctionComponent } from "react";
import { parseAsString, useQueryState } from "nuqs";
import {
  libellésMétéos,
  météosSaisissables,
} from "@/server/domain/météo/Météo.interface";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { RepartitionMeteoContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";
import { clsxm } from "@/utils/clsxm";
import RepartitionsMeteosRapportDetailleStyled from "./RepartitionsMeteosRapportDetailleStyled.styled";

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
    <RepartitionsMeteosRapportDetailleStyled className="fr-grid-row fr-mx-n3v">
      {météosSaisissables.map((meteo) => (
        <li
          className="fr-col-3 fr-p-2v"
          key={libellésMétéos[meteo]}
          title={libellésMétéos[meteo]}
        >
          <button
            className={clsxm(
              "h-full shadow-lg p-2 border !border-dsfr-grey-925 rounded flex flex-column items-center",
              {
                "!border-primary": meteos.includes(meteo),
              },
            )}
            disabled
            type="button"
          >
            <MeteoPicto meteo={meteo} />
            <p className="nombre-de-chantiers fr-h1 fr-mb-0">
              {repartitionMeteos[meteo]}
            </p>
            <p className="label fr-mb-0 break-keep">{libellésMétéos[meteo]}</p>
          </button>
        </li>
      ))}
    </RepartitionsMeteosRapportDetailleStyled>
  );
};

export default RepartitionsMeteosRapportDetaille;
