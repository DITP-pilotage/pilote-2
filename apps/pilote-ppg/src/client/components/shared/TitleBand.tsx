import { ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const TitleBand = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div className={clsxm("py-4 px-8 bg-dsfr-blue-france-925", className)}>
    {children}
  </div>
);
