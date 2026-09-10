import { ReactNode } from "react";
import { clsxm } from "@/utils/clsxm";

export const DashboardPanel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={clsxm(
      "h-full border border-dsfr-grey-925 bg-white p-4",
      className,
    )}
  >
    {children}
  </div>
);
