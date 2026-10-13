import { ReactNode } from "react";
import { MenuLateralPanelAdministrateur } from "@/components/PagePanelAdministrateur/MenuLateralPanelAdministrateur/MenuLateralPanelAdministrateur";

export const PagePanelAdministrateur = ({
  pageActive,
  children,
}: {
  pageActive: string;
  children: ReactNode;
}) => {
  return (
    <div className="flex">
      <MenuLateralPanelAdministrateur pageActive={pageActive} />
      <main className="flex-grow">
        <div className="fr-mt-4w fr-mx-4w fr-mb-3w">
          <h1 className="text-h1 md:text-h1-md mb-6">Panel Administrateur</h1>
          {children}
        </div>
      </main>
    </div>
  );
};
