import { FunctionComponent } from "react";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import { TableauChantiersMétéoTaille } from "@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.interface";
import { formaterDate } from "@/client/utils/date/date";
import { clsxm } from "@/utils/clsxm";

interface TableauChantiersMétéoProps {
  météo: Météo;
  dateDeMàjDonnéesQualitatives?: string | null;
  taille?: TableauChantiersMétéoTaille;
  chantiersSontArchives?: boolean;
}

const libelléMétéosÀPartirDeLaTaille = {
  sm: {
    className: "text-center",
    texte: (_: Météo) => "–",
  },
  md: {
    className: "",
    texte: (météo: Météo) => libellésMétéos[météo],
  },
};

const TableauRéformesMétéo: FunctionComponent<TableauChantiersMétéoProps> = ({
  météo,
  dateDeMàjDonnéesQualitatives,
  taille = "md",
  chantiersSontArchives,
}) => {
  return (
    <div
      className={clsxm("flex flex-column items-center !w-auto", {
        "grayscale-100": chantiersSontArchives,
      })}
    >
      {météo !== "NON_NECESSAIRE" && météo !== "NON_RENSEIGNEE" ? (
        <MeteoPicto meteo={météo} />
      ) : (
        <span
          className={`!text-xs !text-dsfr-mention-grey ${libelléMétéosÀPartirDeLaTaille[taille].className}`}
        >
          {libelléMétéosÀPartirDeLaTaille[taille].texte(météo)}
        </span>
      )}
      {dateDeMàjDonnéesQualitatives ? (
        <span className="!text-dsfr-mention-grey !text-xs">
          {`(${formaterDate(dateDeMàjDonnéesQualitatives, "MM/YYYY")})`}
        </span>
      ) : null}
    </div>
  );
};

export default TableauRéformesMétéo;
