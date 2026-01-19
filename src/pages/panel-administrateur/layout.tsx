import { FunctionComponent, PropsWithChildren } from "react";
import { MenuLateralPanelAdministrateur } from "@/components/PagePanelAdministrateur/MenuLateralPanelAdministrateur/MenuLateralPanelAdministrateur";

interface PanelAdministrateurLayoutProps extends PropsWithChildren {
  pageActive?: string;
}

export const NextPanelAdministrateurLayout: FunctionComponent<
  PanelAdministrateurLayoutProps
> = ({ children, pageActive = "" }) => {
  return (
    <div className="flex min-vh-100">
      <MenuLateralPanelAdministrateur pageActive={pageActive} />
      <main className="flex-grow min-w-0">
        <div className="!mt-4 !mx-4 !mb-3">{children}</div>
      </main>
    </div>
  );
};
