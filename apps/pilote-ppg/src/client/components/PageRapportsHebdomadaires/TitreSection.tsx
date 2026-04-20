import { type ReactNode } from "react";

export const TitreSection = ({ children }: { children: ReactNode }) => {
  return <h3 className="fr-h3 text-primary">{children}</h3>;
};
