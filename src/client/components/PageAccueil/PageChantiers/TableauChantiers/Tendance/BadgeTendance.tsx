import { ComponentType, FunctionComponent } from "react";
import Badge from "@/components/_commons/Badge/Badge";
import { Icone } from "@/components/_commons/Icone";
import { ArrowRightUp1Icon } from "@/components/_commons/Icones/ArrowRightUp1Icon";
import { ChantierTendance } from "@/server/domain/chantier/Chantier.interface";
import { BadgeType } from "@/components/_commons/Badge/Badge.interface";
import { ArrowRightDown1Icon } from "@/components/_commons/Icones/ArrowRightDown1Icon";
import { ArrowLine1Icon } from "@/components/_commons/Icones/ArrowLine1Icon";

export const badgeTypeÀPartirDeLaTendance: Record<
  NonNullable<ChantierTendance>,
  BadgeType
> = {
  HAUSSE: "vert",
  BAISSE: "rouge",
  STAGNATION: "bleu",
};

export const libelléÀPartirDeLaTendance: Record<
  NonNullable<ChantierTendance>,
  string
> = {
  HAUSSE: "En hausse",
  BAISSE: "En baisse",
  STAGNATION: "Stable",
};

const mapTendanceIcon: Record<
  ChantierTendance,
  ComponentType<{ className: string; fill: string }>
> = {
  HAUSSE: ArrowRightUp1Icon,
  BAISSE: ArrowRightDown1Icon,
  STAGNATION: ArrowLine1Icon,
};

export const BadgeTendance: FunctionComponent<{
  tendance: ChantierTendance | null;
  estArchive?: boolean;
}> = ({ tendance, estArchive }) => {
  if (tendance === null) {
    return null;
  }

  return (
    <Badge type={estArchive ? "gris" : badgeTypeÀPartirDeLaTendance[tendance]}>
      <div className="flex align-center pr-1">
        <Icone
          className="w-3 h-3 text-current"
          icone={mapTendanceIcon[tendance ?? "STAGNATION"]}
        />
      </div>
      {libelléÀPartirDeLaTendance[tendance]}
    </Badge>
  );
};
