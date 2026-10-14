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
        <div className="mt-8 mx-8 mb-6">
          <h1 className="text-h1 md:text-h1-md mb-6">Panel Administrateur</h1>
          {children}
        </div>
      </main>
    </div>
  );
};
