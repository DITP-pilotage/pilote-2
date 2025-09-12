import { FunctionComponent } from "react";
import Badge from "@/components/_commons/Badge/Badge";
import { DonnéesTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiers.interface";
import {
  badgeTypeÀPartirDeLaTendance,
  libelléÀPartirDeLaTendance,
} from "@/client/utils/chantier/tendance/tendance";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { ArrowRightUp1Icon } from "@/components/_commons/Icones/ArrowRightUp1Icon";
import { ArrowRightDown1Icon } from "@/components/_commons/Icones/ArrowRightDown1Icon";

interface TableauChantiersTendanceProps {
  tendance: DonnéesTableauChantiers["tendance"];
  estArchive?: boolean;
}

const TableauChantiersTendance: FunctionComponent<
  TableauChantiersTendanceProps
> = ({ tendance, estArchive }) => {
  if (tendance === null) {
    return null;
  }

  return (
    <Badge type={estArchive ? "gris" : badgeTypeÀPartirDeLaTendance[tendance]}>
      <div className="flex align-center">
        {tendance === "HAUSSE" ? (
          <Icone className="w-3 h-3 text-current" icone={ArrowRightUp1Icon} />
        ) : tendance === "BAISSE" ? (
          <Icone className="w-3 h-3 text-current" icone={ArrowRightDown1Icon} />
        ) : (
          <Icone className="w-3 h-3 text-current" icone={ArrowLine1Icon} />
        )}
      </div>
      {libelléÀPartirDeLaTendance[tendance]}
    </Badge>
  );
};

export default TableauChantiersTendance;
