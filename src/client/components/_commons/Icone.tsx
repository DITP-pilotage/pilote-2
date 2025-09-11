import { ComponentType } from "react";
import clsx from "clsx";

export const Icone = ({
  className,
  icone: IconComponent,
}: {
  className?: string;
  icone: ComponentType<{ className: string; fill: string }>;
}) => {
  return (
    <IconComponent
      className={clsx("w-6 h-6 text-dsfr-blue-france-sun-113", className)}
      fill="currentColor"
    />
  );
};
