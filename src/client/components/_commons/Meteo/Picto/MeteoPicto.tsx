import { ComponentType } from "react";
import { Meteo } from "@/server/domain/météo/Météo.interface";
import { MeteoCouvertIcon } from "@/components/_commons/IconeMeteo/MeteoCouvertIcon";
import { MeteoOrageIcon } from "@/components/_commons/IconeMeteo/MeteoOrageIcon";
import { MeteoNuageIcon } from "@/components/_commons/IconeMeteo/MeteoNuageIcon";
import { MeteoSoleilIcon } from "@/components/_commons/IconeMeteo/MeteoSoleilIcon";
import { clsxm } from "@/utils/clsxm";

export const MeteoComponentMap: Record<
  Meteo,
  ComponentType<{ className?: string }> | null
> = {
  ORAGE: MeteoOrageIcon,
  NUAGE: MeteoNuageIcon,
  COUVERT: MeteoCouvertIcon,
  SOLEIL: MeteoSoleilIcon,
  NON_RENSEIGNEE: null,
  NON_NECESSAIRE: null,
};

export const MeteoPicto = ({
  meteo,
  size = "md",
}: {
  meteo: Meteo;
  size?: "md" | "sm";
}) => {
  const MeteoComponent = MeteoComponentMap[meteo];
  if (MeteoComponent === null) return null;

  return (
    <MeteoComponent
      className={clsxm({
        "h-10 w-10": size === "md",
        "h-4 w-4": size === "sm",
      })}
    />
  );
};
