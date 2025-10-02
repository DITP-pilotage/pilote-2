import { MouseEventHandler, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const Bouton = ({
  label,
  onClick,
  className,
  iconLeft,
  iconRight,
  variant,
}: {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  variant?: "primary" | "secondary";
}) => {
  return (
    <button
      className={clsxm(
        "fr-btn gap-2",
        { "fr-btn--secondary": variant === "secondary" },
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {iconLeft}
      {label}
      {iconRight}
    </button>
  );
};
