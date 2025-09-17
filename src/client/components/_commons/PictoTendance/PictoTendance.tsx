import { ComponentType, FunctionComponent } from "react";
import { ChantierTendance } from "@/server/domain/chantier/Chantier.interface";
import { ArrowRightUp1Icon } from "@/components/_commons/Icones/ArrowRightUp1Icon";
import { ArrowRightDown1Icon } from "@/components/_commons/Icones/ArrowRightDown1Icon";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";
import { Icone } from "@/components/_commons/Icone";

type Tendance = ChantierTendance;

const mapTendanceIcon: Record<
  ChantierTendance,
  ComponentType<{ className: string; fill: string }>
> = {
  HAUSSE: ArrowRightUp1Icon,
  BAISSE: ArrowRightDown1Icon,
  STAGNATION: ArrowLine1Icon,
};

const mapColorPicto = {
  HAUSSE: "text-success",
  BAISSE: "text-error",
  STAGNATION: "text-primary",
  ARCHIVE: "text-dsfr-grey-625",
};

export const PictoTendance: FunctionComponent<{
  tendance: Tendance | null;
  estArchive?: boolean;
}> = ({ tendance, estArchive }) => {
  if (tendance === null) return null;

  let color: keyof typeof mapColorPicto = estArchive ? "ARCHIVE" : tendance;

  return (
    <Icone
      className={mapColorPicto[color]}
      icone={mapTendanceIcon[tendance ?? "STAGNATION"]}
    />
  );
};
