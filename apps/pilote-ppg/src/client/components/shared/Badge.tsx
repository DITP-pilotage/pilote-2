import { ComponentType, HTMLAttributes, ReactNode } from "react";
import { Icone } from "@/components/_commons/Icone";
import { clsxm } from "@/utils/clsxm";

// Reproduit le composant « Badge » du DSFR (majuscules, gras, coins arrondis).
export type BadgeVariant =
  "default" | "success" | "error" | "info" | "warning" | "green-tilleul";

const COLORS: Record<BadgeVariant, string> = {
  default: "bg-dsfr-grey-950 text-dsfr-grey-200",
  success: "bg-dsfr-success-950 text-dsfr-success-425",
  error: "bg-dsfr-error-950 text-dsfr-error-425",
  info: "bg-dsfr-info-950 text-dsfr-info-425",
  warning: "bg-dsfr-warning-950 text-dsfr-warning-425",
  "green-tilleul":
    "bg-dsfr-green-tilleul-verveine-950 text-dsfr-green-tilleul-verveine-sun",
};

const SIZES = {
  md: { badge: "min-h-6 px-2 text-sm leading-6", icon: "w-4 h-4" },
  sm: { badge: "min-h-5 px-1.5 text-xs leading-5", icon: "w-3 h-3" },
};

export const Badge = ({
  variant = "default",
  size = "md",
  icon,
  className,
  children,
  ...props
}: Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> & {
  variant?: BadgeVariant;
  size?: keyof typeof SIZES;
  icon?: ComponentType<{ className: string; fill: string }>;
  className?: string;
  children?: ReactNode;
}) => (
  <span
    {...props}
    className={clsxm(
      "inline-flex items-center gap-1 w-fit max-w-full rounded font-bold uppercase whitespace-nowrap",
      SIZES[size].badge,
      COLORS[variant],
      className,
    )}
  >
    {icon ? (
      <Icone className={clsxm(SIZES[size].icon, "text-current")} icone={icon} />
    ) : null}
    {children}
  </span>
);
