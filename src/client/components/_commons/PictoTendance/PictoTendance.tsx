import { ComponentType, FunctionComponent } from "react";
import { ChantierTendance } from "@/server/domain/chantier/Chantier.interface";
import { ArrowRightUp1Icon } from "@/components/_commons/Icones/ArrowRightUp1Icon";
import { ArrowRightDown1Icon } from "@/components/_commons/Icones/ArrowRightDown1Icon";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { Icone } from "@/components/_commons/Icone";

type Tendance = ChantierTendance;

interface PictoTendanceProps {
  tendance: Tendance | null;
  estArchive?: boolean;
}

const mapTendanceIcon: Record<
  ChantierTendance,
  ComponentType<{ className: string; fill: string }>
> = {
  HAUSSE: ArrowRightUp1Icon,
  BAISSE: ArrowRightDown1Icon,
  STAGNATION: ArrowLine1Icon,
};

const PictoTendance: FunctionComponent<PictoTendanceProps> = ({
  tendance,
  estArchive,
}) => {
  if (tendance === null) return null;

  return (
    <Icone
      className="text-current"
      icone={mapTendanceIcon[tendance ?? "STAGNATION"]}
    />
  );
};

export default PictoTendance;
