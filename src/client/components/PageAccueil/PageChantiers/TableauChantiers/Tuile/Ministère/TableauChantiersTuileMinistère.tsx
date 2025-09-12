import { FunctionComponent } from "react";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import TableauChantiersTuileMinistèreStyled from "./TableauChantiersTuileMinistère.styled";
import TableauChantiersTuileMinistèreProps from "./TableauChantiersTuileMinistère.interface";

const TableauChantiersTuileMinistère: FunctionComponent<
  TableauChantiersTuileMinistèreProps
> = ({ ministère, estDéroulé, estArchive }) => {
  return (
    <TableauChantiersTuileMinistèreStyled>
      <div>
        <div className="fr-mb-0 fr-ml-n1w">
          <div className="flex gap-2">
            <div>
              <IconeMinistere
                className="text-dsfr-blue-france-sun-113"
                icone={ministère.icône}
              />
            </div>
            {ministère?.nom}
          </div>
        </div>
        <div className="fr-mx-3w fr-mt-1v avancement">
          <BarreDeProgression
            fond="blanc"
            taille="sm"
            valeur={ministère.avancement}
            variante={estArchive ? "secondaire" : "primaire"}
          />
        </div>
      </div>
      <button
        className={`${estDéroulé ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"} chevron-accordéon`}
        type="button"
      />
    </TableauChantiersTuileMinistèreStyled>
  );
};

export default TableauChantiersTuileMinistère;
