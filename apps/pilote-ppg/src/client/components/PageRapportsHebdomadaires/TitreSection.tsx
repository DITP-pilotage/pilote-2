import { type ReactNode } from "react";

export const TitreSection = ({ children }: { children: ReactNode }) => {
  return <h3 className="text-h3 md:text-h3-md text-primary">{children}</h3>;
};
