import { createContext, FunctionComponent, ReactNode, useContext } from "react";
import { ChantierAccueilContratV2 } from "@/server/chantiers/app/contrats/ChantierAccueilContratV2";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import {
  AvancementsGlobauxTerritoriauxMoyensContrat,
  AvancementsStatistiquesAccueilContrat,
} from "@/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat";
import { RepartitionMeteoContrat } from "@/server/fiche-territoriale/app/contrats/RepartitionMeteoContrat";

export interface PageAccueilContextValue {
  chantiers: ChantierAccueilContratV2[];
  chantierIds: string[];
  chantierIdsSansFiltrageAlertes: string[];
  nombreTotalChantiersAvecAlertes: number;
  ministères: Ministère[];
  territoireCode: string;
  mailleQuery: MailleInterne;
  filtresComptesCalculés: Record<TypeAlerteChantier, number>;
  avancementsAgrégés: AvancementsStatistiquesAccueilContrat;
  avancementsGlobauxTerritoriauxMoyens: AvancementsGlobauxTerritoriauxMoyensContrat;
  repartitionMeteosChantiers: RepartitionMeteoContrat;
  jalon: number;
  jalonParDefaut: number;
  moyenneTerritoire: number | null;
}

const PageAccueilContext = createContext<PageAccueilContextValue | null>(null);

export const PageAccueilProvider: FunctionComponent<{
  value: PageAccueilContextValue;
  children: ReactNode;
}> = ({ value, children }) => (
  <PageAccueilContext.Provider value={value}>
    {children}
  </PageAccueilContext.Provider>
);

export const usePageAccueilContext = (): PageAccueilContextValue => {
  const context = useContext(PageAccueilContext);
  if (!context) {
    throw new Error(
      "usePageAccueilContext doit être utilisé dans un PageAccueilProvider",
    );
  }
  return context;
};
