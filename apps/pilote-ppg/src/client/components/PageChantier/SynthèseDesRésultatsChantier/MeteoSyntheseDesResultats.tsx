import MétéoBadge from "@/components/_commons/Meteo/Badge/MétéoBadge";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { Meteo } from "@/shared/meteo/Meteo.interface";

export const MeteoSyntheseDesResultats = ({
  meteo,
}: {
  meteo: Meteo | undefined;
}) => (
  <>
    <MétéoBadge météo={meteo ?? "NON_RENSEIGNEE"} />
    {meteo ? <MeteoPicto meteo={meteo} /> : null}
  </>
);
