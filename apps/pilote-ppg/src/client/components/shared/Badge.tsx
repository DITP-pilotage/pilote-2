import { ComponentType, HTMLAttributes, ReactNode } from "react";
import { Icone } from "@/components/_commons/Icone";
import { clsxm } from "@/utils/clsxm";

// Reproduit le composant « Badge » du DSFR (majuscules, gras, coins arrondis).
export type VarianteBadge =
  "defaut" | "succes" | "erreur" | "info" | "attention" | "vert-tilleul";

const COULEURS: Record<VarianteBadge, string> = {
  defaut: "bg-dsfr-grey-950 text-dsfr-grey-200",
  succes: "bg-dsfr-success-950 text-dsfr-success-425",
  erreur: "bg-dsfr-error-950 text-dsfr-error-425",
  info: "bg-dsfr-info-950 text-dsfr-info-425",
  attention: "bg-dsfr-warning-950 text-dsfr-warning-425",
  "vert-tilleul":
    "bg-dsfr-green-tilleul-verveine-950 text-dsfr-green-tilleul-verveine-sun",
};

const TAILLES = {
  md: { badge: "min-h-6 px-2 text-sm leading-6", icone: "w-4 h-4" },
  sm: { badge: "min-h-5 px-1.5 text-xs leading-5", icone: "w-3 h-3" },
};

export const Badge = ({
  variante = "defaut",
  taille = "md",
  icone,
  className,
  children,
  ...props
}: Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> & {
  variante?: VarianteBadge;
  taille?: keyof typeof TAILLES;
  icone?: ComponentType<{ className: string; fill: string }>;
  className?: string;
  children?: ReactNode;
}) => (
  <span
    {...props}
    className={clsxm(
      "inline-flex items-center gap-1 w-fit max-w-full rounded font-bold uppercase whitespace-nowrap",
      TAILLES[taille].badge,
      COULEURS[variante],
      className,
    )}
  >
    {icone ? (
      <Icone
        className={clsxm(TAILLES[taille].icone, "text-current")}
        icone={icone}
      />
    ) : null}
    {children}
  </span>
);
