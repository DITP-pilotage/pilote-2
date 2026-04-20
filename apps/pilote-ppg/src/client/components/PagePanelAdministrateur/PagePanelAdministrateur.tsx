import { ReactNode } from "react";
import Titre from "@/components/_commons/Titre/Titre";
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
          <Titre baliseHtml="h1" className="fr-h1 fr-mb-3w">
            Panel Administrateur
          </Titre>
          {children}
        </div>
      </main>
    </div>
  );
};
