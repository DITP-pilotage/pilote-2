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
    <span className="grid grid-cols-[auto_max-content]">
      <span className="block">
        <span className="block mb-0 -ml-2">
          <span className="flex gap-2">
            <span className="block">
              <IconeMinistere
                className="text-dsfr-blue-france-sun-113"
                icone={ministère.icône}
              />
            </span>
            {ministère?.nom}
          </span>
        </span>
        <span className="block mx-6 mt-1 max-w-60">
          <BarreDeProgression
            fond="blanc"
            taille="sm"
            valeur={ministère.avancement}
            variante={estArchive ? "secondaire" : "primaire"}
          />
        </span>
      </span>
      <span aria-hidden="true">
        {estDéroulé ? (
          <Icone icone={ArrowSLineIcon} />
        ) : (
          <Icone icone={ArrowSLine2Icon} />
        )}
      </span>
    </span>
  );
};

export default TableauChantiersTuileMinistère;
