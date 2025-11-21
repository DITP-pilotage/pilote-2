import { ComponentProps, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const Bouton = ({
  label,
  iconLeft,
  iconRight,
  variant,
  className,
  size = "default",
  ...props
}: {
  label: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  variant?: "primary" | "secondary" | "link";
  size?: "sm" | "default";
} & ComponentProps<"button">) => {
  return (
    <button
      className={clsxm(
        "gap-2",
        {
          "fr-link flex": variant === "link",
          "fr-btn fr-btn--secondary": variant === "secondary",
          "fr-btn": variant === "primary",
          "fr-btn--sm": size === "sm",
        },
        className,
      )}
      type="button"
      {...props}
    >
      {iconLeft}
      {label}
      {iconRight}
    </button>
  );
};
