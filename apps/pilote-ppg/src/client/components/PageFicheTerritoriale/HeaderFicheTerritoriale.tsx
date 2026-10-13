import { FunctionComponent } from "react";
import { Logo } from "@/components/shared/Logo";

const HeaderFicheTerritoriale: FunctionComponent = () => {
  return (
    <div className="hidden print:block">
      <header className="flex fr-px-4w fr-mb-0" role="banner">
        <Logo />
        <div className="fr-pt-1w fr-ml-5w">
          <p className="fr-text--xl fr-text--bold fr-mb-0">PILOTE</p>
          <p className="fr-text--sm fr-mb-0">
            Piloter l'action publique par les résultats
          </p>
        </div>
      </header>
    </div>
  );
};

export default HeaderFicheTerritoriale;
