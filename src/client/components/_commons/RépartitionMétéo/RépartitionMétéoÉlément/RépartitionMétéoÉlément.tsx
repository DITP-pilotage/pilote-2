import { FunctionComponent } from "react";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import { clsxm } from "@/utils/clsxm";

interface RépartitionMétéoÉlémentProps {
  météo: Météo;
  nombreDeChantiers: string;
  estArchive?: boolean;
}

const RépartitionMétéoÉlément: FunctionComponent<
  RépartitionMétéoÉlémentProps
> = ({ météo, nombreDeChantiers, estArchive }) => {
  return (
    <div
      className={clsxm(
        "flex flex-col items-center shadow-lg border border-dsfr-grey-925 rounded gap-2 p-4",
        {
          "grayscale-100": estArchive,
        },
      )}
    >
      <MeteoPicto meteo={météo} />
      <span className="!text-primary !text-5xl bold">{nombreDeChantiers}</span>
      <span className="!text-xs bold text-center">{libellésMétéos[météo]}</span>
    </div>
  );
};

export default RépartitionMétéoÉlément;
