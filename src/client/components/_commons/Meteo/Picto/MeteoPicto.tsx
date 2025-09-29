import { ComponentType } from "react";
import { Météo } from "@/server/domain/météo/Météo.interface";
import { MeteoCouvertIcon } from "@/components/_commons/IconeMeteo/MeteoCouvertIcon";
import { MeteoOrageIcon } from "@/components/_commons/IconeMeteo/MeteoOrageIcon";
import { MeteoNuageIcon } from "@/components/_commons/IconeMeteo/MeteoNuageIcon";
import { MeteoSoleilIcon } from "@/components/_commons/IconeMeteo/MeteoSoleilIcon";

export const MeteoComponentMap: Record<
  Météo,
  ComponentType<{ className?: string }> | null
> = {
  ORAGE: MeteoOrageIcon,
  NUAGE: MeteoNuageIcon,
  COUVERT: MeteoCouvertIcon,
  SOLEIL: MeteoSoleilIcon,
  NON_RENSEIGNEE: null,
  NON_NECESSAIRE: null,
};

export const MeteoPicto = ({ meteo }: { meteo: Météo }) => {
  const MeteoComponent = MeteoComponentMap[meteo];
  if (MeteoComponent === null) return null;

  return <MeteoComponent className="h-10 w-10" />;
};
