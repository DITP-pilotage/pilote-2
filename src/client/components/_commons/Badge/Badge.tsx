import { FunctionComponent, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";
import BadgeStyled from "./Badge.styled";
import "@gouvfr/dsfr/dist/component/badge/badge.min.css";

export type BadgeType = "rouge" | "jaune" | "bleu" | "vert" | "gris" | "noir";

export interface BadgeProps {
  children: ReactNode;
  type: BadgeType;
}

const badgeÀPartirDuType: Record<BadgeType, string> = {
  rouge: "badge-rouge",
  jaune: "badge-jaune",
  bleu: "badge-bleu",
  vert: "badge-vert",
  gris: "badge-gris",
  noir: "badge-noir",
};

export const Badge: FunctionComponent<BadgeProps> = ({ children, type }) => {
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
