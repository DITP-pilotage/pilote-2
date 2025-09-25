import { MouseEventHandler, ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const Bouton = ({
  label,
  onClick,
  className,
  iconLeft,
  iconRight,
}: {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}) => {
  return (
    <button
      className={clsxm("fr-btn gap-2", className)}
      onClick={onClick}
      type="button"
    >
      {iconLeft}
      {label}
      {iconRight}
    </button>
  );
};
