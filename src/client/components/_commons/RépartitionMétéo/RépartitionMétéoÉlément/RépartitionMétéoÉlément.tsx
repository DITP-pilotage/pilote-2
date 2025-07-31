import { FunctionComponent } from "react";
import MeteoPicto from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import RépartitionMétéoÉlémentStyled from "./RépartitionMétéoÉlément.styled";

interface RépartitionMétéoÉlémentProps {
  météo: Météo;
  nombreDeChantiers: string;
  estArchive?: boolean;
}

const RépartitionMétéoÉlément: FunctionComponent<
  RépartitionMétéoÉlémentProps
> = ({ météo, nombreDeChantiers, estArchive }) => {
  return (
    <RépartitionMétéoÉlémentStyled estArchive={estArchive}>
      <MeteoPicto meteo={météo} />
      <p className="nombre-de-chantiers fr-h1 fr-mb-0">{nombreDeChantiers}</p>
      <p className="label fr-mb-0 break-keep">{libellésMétéos[météo]}</p>
    </RépartitionMétéoÉlémentStyled>
  );
};

export default RépartitionMétéoÉlément;
