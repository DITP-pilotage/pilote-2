import pictoSoleil from "/public/img/météo/soleil.svg";
import pictoCouvert from "/public/img/météo/couvert.svg";
import pictoNuage from "/public/img/météo/nuage.svg";
import pictoOrage from "/public/img/météo/orage.svg";
import Image from "next/image";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import { FunctionComponent } from "react";

interface MeteoPictoProps {
  meteo: Météo;
  estVisibleParLecteurDÉcran?: boolean;
}

export const meteosPictos: Record<Météo, string | null> = {
  ORAGE: pictoOrage,
  NUAGE: pictoNuage,
  COUVERT: pictoCouvert,
  SOLEIL: pictoSoleil,
  NON_RENSEIGNEE: null,
  NON_NECESSAIRE: null,
};

const MeteoPicto: FunctionComponent<MeteoPictoProps> = ({
  meteo,
  estVisibleParLecteurDÉcran = false,
}) => {
  const src = meteosPictos[meteo];
  if (src == null) return null;

  return (
    <Image
      alt={estVisibleParLecteurDÉcran ? libellésMétéos[meteo] : ""}
      aria-hidden={estVisibleParLecteurDÉcran ? undefined : "true"}
      className="meteo-picto inline"
      src={src}
    />
  );
};

export default MeteoPicto;
