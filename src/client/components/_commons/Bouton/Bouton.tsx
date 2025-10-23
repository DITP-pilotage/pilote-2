import { ComponentProps, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const Bouton = ({
  label,
  iconLeft,
  iconRight,
  variant,
  className,
  ...props
}: {
  label: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  variant?: "primary" | "secondary";
} & ComponentProps<"button">) => {
  return (
    <button
      className={clsxm(
        "fr-btn gap-2",
        { "fr-btn--secondary": variant === "secondary" },
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
