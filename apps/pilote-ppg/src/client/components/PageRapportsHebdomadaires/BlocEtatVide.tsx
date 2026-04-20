import { type ReactNode } from "react";

export const BlocEtatVide = ({ children }: { children: ReactNode }) => {
  return (
    <div className="p-8 border-t border-gray-200">
      <p className="fr-text--sm fr-mb-0">{children}</p>
    </div>
  );
};
