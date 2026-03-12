import { FunctionComponent } from "react";
import {
  libellesMeteos,
  MeteoSaisissable,
} from "@/server/domain/météo/Météo.interface";
import RépartitionMétéoÉlément from "./RépartitionMétéoÉlément/RépartitionMétéoÉlément";
import RépartitionMétéoStyled from "./RépartitionMétéo.styled";

export type RépartitionMétéos = Record<MeteoSaisissable, number>;

interface RépartitionMétéoProps {
  météos: RépartitionMétéos;
  chantiersSontArchives?: boolean;
}

const météosÀAfficher = ["ORAGE", "NUAGE", "COUVERT", "SOLEIL"] as const;

const RépartitionMétéo: FunctionComponent<RépartitionMétéoProps> = ({
  météos,
  chantiersSontArchives,
}) => {
  return (
    <RépartitionMétéoStyled className="flex gap-4">
      {météosÀAfficher.map((météo) => (
        <li key={libellesMeteos[météo]}>
          <RépartitionMétéoÉlément
            estArchive={chantiersSontArchives}
            météo={météo}
            nombreDeChantiers={`${météos[météo]}`}
          />
        </li>
      ))}
    </RépartitionMétéoStyled>
  );
};

export default RépartitionMétéo;
