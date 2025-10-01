import { FunctionComponent, PropsWithChildren } from "react";
import { MenuLateralPanelAdministrateur } from "@/components/PagePanelAdministrateur/MenuLateralPanelAdministrateur/MenuLateralPanelAdministrateur";

interface PanelAdministrateurLayoutProps extends PropsWithChildren {
  pageActive?: string;
}

const NextPanelAdministrateurLayout: FunctionComponent<
  PanelAdministrateurLayoutProps
> = ({ children, pageActive = "" }) => {
  return (
    <div className="flex" style={{ minHeight: "100vh" }}>
      <MenuLateralPanelAdministrateur pageActive={pageActive} />
      <main className="flex-grow" style={{ minWidth: 0 }}>
        <div className="fr-mt-4w fr-mx-4w fr-mb-3w">{children}</div>
      </main>
    </div>
  );
};

export default NextPanelAdministrateurLayout;
