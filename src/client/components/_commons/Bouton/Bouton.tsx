import { ComponentProps, forwardRef, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const Bouton = forwardRef<
  HTMLButtonElement,
  {
    label: ReactNode;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    variant?: "primary" | "secondary" | "link";
    size?: "sm" | "default";
  } & ComponentProps<"button">
>(function Bouton(
  {
    label,
    iconLeft,
    iconRight,
    variant,
    className,
    size = "default",
    ...props
  },
  ref,
) {
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
      ref={ref}
      type="button"
      {...props}
    >
      {iconLeft}
      {label}
      {iconRight}
    </button>
  );
});
