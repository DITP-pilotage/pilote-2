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
  variant?: "primary" | "secondary";
  size?: "sm" | "default";
} & ComponentProps<"button">) => {
  return (
    <button
      className={clsxm(
        "fr-btn gap-2",
        {
          "fr-btn--secondary": variant === "secondary",
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
