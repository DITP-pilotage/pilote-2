import { FunctionComponent } from "react";
import { Logo } from "@/components/shared/Logo";

const HeaderFicheTerritoriale: FunctionComponent = () => {
  return (
    <div className="hidden print:block">
      <header className="flex px-8 mb-0" role="banner">
        <Logo />
        <div className="pt-2 ml-10">
          <p className="fr-text--xl fr-text--bold mb-0">PILOTE</p>
          <p className="fr-text--sm mb-0">
            Piloter l'action publique par les résultats
          </p>
        </div>
      </header>
    </div>
  );
};

export default HeaderFicheTerritoriale;
