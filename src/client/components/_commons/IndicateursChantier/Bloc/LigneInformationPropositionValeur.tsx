import { PropsWithChildren, ReactNode } from "react";
import Chantier from "@/server/domain/chantier/Chantier.interface";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DétailTerritoire } from "@/server/domain/territoire/Territoire.interface";
import { BoutonVoirHistorique } from "@/components/_commons/IndicateursChantier/Bloc/BoutonVoirHistorique";

export const LigneInformationPropositionValeur = ({
  className,
  children,
  action,
  chantier,
  indicateur,
  territoireCode,
  territoireSélectionné,
}: PropsWithChildren<{
  className: string;
  action: ReactNode;
  chantier: Chantier;
  indicateur: Indicateur;
  territoireCode: string;
  territoireSélectionné: DétailTerritoire;
}>) => {
  return (
    <div className={className}>
      <p className="fr-text--xs fr-mb-0">{children}</p>
      <div className="flex items-center">
        <BoutonVoirHistorique
          chantier={chantier}
          id={indicateur.id}
          indicateur={indicateur}
          territoireCode={territoireCode}
          territoireSélectionné={territoireSélectionné}
        />
        {action}
      </div>
    </div>
  );
};
