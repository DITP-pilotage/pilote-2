"use client";

import { ReactNode, useState } from "react";
import { Icone } from "@/components/_commons/Icone";
import { CloseLineIcon } from "@/components/_commons/Icones/CloseLineIcon";
import { InformationPleineIcon } from "@/components/_commons/Icones/InformationPleineIcon";
import { WarningIcon } from "@/components/_commons/Icones/WarningIcon";
import { clsxm } from "@/utils/clsxm";

// Reproduit le bandeau « Notice » du DSFR : pleine largeur, titre en gras
// précédé d'une icône, texte facultatif, bouton de fermeture facultatif.
export type NoticeVariant = "info" | "warning" | "neutral";

const VARIANTS: Record<
  NoticeVariant,
  { colors: string; icon?: typeof WarningIcon }
> = {
  info: {
    colors: "bg-dsfr-info-950 text-dsfr-info-425",
    icon: InformationPleineIcon,
  },
  warning: {
    colors: "bg-dsfr-warning-950 text-dsfr-warning-425",
    icon: WarningIcon,
  },
  neutral: { colors: "bg-dsfr-grey-925 text-dsfr-grey-200" },
};

export const Notice = ({
  variant = "info",
  title,
  children,
  dismissible = false,
  className,
  containerClassName = "fr-container",
}: {
  variant?: NoticeVariant;
  title?: ReactNode;
  children?: ReactNode;
  dismissible?: boolean;
  className?: string;
  containerClassName?: string;
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const { colors, icon } = VARIANTS[variant];

  return (
    <div className={clsxm("w-full py-4", colors, className)} role="note">
      <div
        className={clsxm(
          "flex items-start justify-between gap-2",
          containerClassName,
        )}
      >
        <div className="flex items-start gap-2">
          {title && icon ? (
            <Icone className="w-6 h-6 shrink-0 text-current" icone={icon} />
          ) : null}
          <p className="text-sm leading-6 mb-0">
            {title ? <span className="font-bold">{title}</span> : null}
            {title && children ? " " : null}
            {children}
          </p>
        </div>
        {dismissible ? (
          <button
            className="flex items-center justify-center shrink-0 w-8 h-8 text-current hover:bg-black/5 rounded-none"
            onClick={() => setVisible(false)}
            title="Masquer le message"
            type="button"
          >
            <Icone className="w-4 h-4 text-current" icone={CloseLineIcon} />
            <span className="sr-only">Masquer le message</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
