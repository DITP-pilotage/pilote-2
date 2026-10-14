import { PropsWithChildren, ReactNode } from "react";
import { BoutonVoirHistorique } from "@/components/_commons/IndicateursChantier/Bloc/BoutonVoirHistorique";

export const LigneInformationPropositionValeur = ({
  className,
  children,
  action,
}: PropsWithChildren<{
  className: string;
  action: ReactNode;
}>) => {
  return (
    <div className={className}>
      <p className="text-xs print:text-base mb-0">{children}</p>
      <div className="flex items-center">
        <BoutonVoirHistorique />
        {action}
      </div>
    </div>
  );
};
