import { FunctionComponent, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";
import "@gouvfr/dsfr/dist/component/badge/badge.min.css";

export type BadgeType = "rouge" | "jaune" | "bleu" | "vert" | "gris" | "noir";

export interface BadgeProps {
  children: ReactNode;
  type: BadgeType;
}

const badgeÀPartirDuType: Record<BadgeType, string> = {
  rouge: "text-error bg-dsfr-warning-950",
  jaune: "text-dsfr-green-tilleul-verveine-sun bg-dsfr-green-tilleul-verveine-950",
  bleu: "text-dsfr-info-main-525 bg-dsfr-info-950",
  vert: "text-success bg-dsfr-green-emeraude-975",
  gris: "text-dsfr-mention-grey bg-dsfr-grey-925",
  noir: "text-white bg-black",
};

export const Badge: FunctionComponent<BadgeProps> = ({ children, type }) => {
  return (
    <div
      className={clsxm(
        "fr-badge fr-badge--no-icon !w-auto text-xs whitespace-nowrap",
        badgeÀPartirDuType[type],
      )}
    >
      {children}
    </div>
  );
};
