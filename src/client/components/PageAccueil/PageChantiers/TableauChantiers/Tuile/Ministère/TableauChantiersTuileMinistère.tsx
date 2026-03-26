import { FunctionComponent } from "react";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { IconeMinistere } from "@/client/utils/mapperIconeMinistereVersIcone";
import { Icone } from "@/components/_commons/Icone";
import { ArrowSLine2Icon } from "@/components/_commons/Icones/ArrowSLine2Icon";
import { ArrowSLineIcon } from "@/components/_commons/Icones/ArrowSLineIcon";
import TableauChantiersTuileMinistèreProps from "./TableauChantiersTuileMinistère.interface";

const TableauChantiersTuileMinistère: FunctionComponent<
  TableauChantiersTuileMinistèreProps
> = ({ ministère, estDéroulé, estArchive }) => {
  return (
    <div className="grid grid-cols-[auto_max-content]">
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
        <div className="fr-mx-3w fr-mt-1v max-w-60">
          <BarreDeProgression
            fond="blanc"
            taille="sm"
            valeur={ministère.avancement}
            variante={estArchive ? "secondaire" : "primaire"}
          />
        </div>
      </div>
      <button type="button">
        {estDéroulé ? (
          <Icone icone={ArrowSLineIcon} />
        ) : (
          <Icone icone={ArrowSLine2Icon} />
        )}
      </button>
    </div>
  );
};

export default TableauChantiersTuileMinistère;
