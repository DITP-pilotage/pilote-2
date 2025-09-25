import "@gouvfr/dsfr/dist/component/button/button.min.css";
import { ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const SubmitBouton = ({
  label,
  disabled,
  className,
  iconRight,
}: {
  label: string;
  disabled?: boolean;
  className?: string;
  iconRight?: ReactNode;
}) => {
  return (
    <button
      className={clsxm("fr-btn gap-2", className)}
      disabled={disabled}
      title={label}
      type="submit"
    >
      {label}
      {iconRight}
    </button>
  );
};
