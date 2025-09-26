import { FunctionComponent } from "react";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import { TableauChantiersMétéoTaille } from "@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.interface";
import { formaterDate } from "@/client/utils/date/date";
import TableauRéformesMétéoStyled from "@/components/PageAccueil/TableauRéformes/Météo/TableauRéformesMétéo.styled";

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
    <TableauRéformesMétéoStyled
      estArchive={chantiersSontArchives}
      taille={taille}
    >
      {météo !== "NON_NECESSAIRE" && météo !== "NON_RENSEIGNEE" ? (
        <div className="fr-ml-1w">
          <MeteoPicto meteo={météo} />
        </div>
      ) : (
        <span
          className={`fr-text--xs !text-dsfr-mention-grey ${libelléMétéosÀPartirDeLaTaille[taille].className}`}
        >
          {libelléMétéosÀPartirDeLaTaille[taille].texte(météo)}
        </span>
      )}
      {!!dateDeMàjDonnéesQualitatives &&
        process.env.NEXT_PUBLIC_FF_DATE_METEO === "true" && (
          <span className="!text-dsfr-mention-grey">
            {`(${formaterDate(dateDeMàjDonnéesQualitatives, "MM/YYYY")})`}
          </span>
        )}
    </TableauRéformesMétéoStyled>
  );
};

export default TableauRéformesMétéo;
