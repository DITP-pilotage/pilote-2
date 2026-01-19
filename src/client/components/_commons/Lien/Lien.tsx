import { ComponentProps, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const Lien = ({
  label,
  iconLeft,
  iconRight,
  variant = "primary",
  className,
  ...props
}: {
  label: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  variant?: "primary" | "button" | "button-secondary";
} & ComponentProps<"a">) => {
  return (
    <a
      className={clsxm(
        "flex gap-2 items-center",
        {
          "fr-link": variant === "primary",
          "fr-btn": variant === "button",
          "fr-btn fr-btn--secondary": variant === "button-secondary",
        },
        className,
      )}
      {...props}
    >
      {iconLeft}
      {label}
      {iconRight}
    </a>
  );
};
