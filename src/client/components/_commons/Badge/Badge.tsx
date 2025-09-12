import { FunctionComponent } from "react";
import { clsxm } from "@/utils/clsxm";
import MétéoBadgeProps, { BadgeType } from "./Badge.interface";
import BadgeStyled from "./Badge.styled";

const badgeÀPartirDuType: Record<BadgeType, string> = {
  rouge: "badge-rouge",
  jaune: "badge-jaune",
  bleu: "badge-bleu",
  vert: "badge-vert",
  gris: "badge-gris",
};

export const Badge: FunctionComponent<MétéoBadgeProps> = ({
  children,
  type,
}) => {
  return (
    <BadgeStyled
      className={clsxm(
        `fr-badge fr-badge--no-icon no-wrap`,
        badgeÀPartirDuType[type],
      )}
    >
      {children}
    </BadgeStyled>
  );
};
