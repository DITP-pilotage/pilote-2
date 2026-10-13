import { FunctionComponent } from "react";
import { Logo } from "@/components/shared/Logo";

const HeaderFicheTerritoriale: FunctionComponent = () => {
  return (
    <div className="hidden print:block">
      <header className="flex px-8 mb-0" role="banner">
        <Logo />
        <div className="pt-2 ml-10">
          <p className="text-lead font-bold mb-0">PILOTE</p>
          <p className="text-sm print:text-base mb-0">
            Piloter l'action publique par les résultats
          </p>
        </div>
      </header>
    </div>
  );
};

export default HeaderFicheTerritoriale;
