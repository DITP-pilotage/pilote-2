import { EvenementVA } from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiersVA";
import { PeriodeRapport } from "@/server/rapports-hebdomadaires/domain/PeriodeRapport";

export type TerritoireInfo = {
  code: string;
  nom: string;
};

export interface ActiviteVAGateway {
  recupererEvenementsDansPeriode(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    periode: PeriodeRapport;
  }): Promise<EvenementVA[]>;

  recupererDernierEvenementAvantPeriode(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    dateDebut: Date;
  }): Promise<EvenementVA[]>;

  recupererTerritoires(
    territoireCodes: string[],
  ): Promise<Record<string, TerritoireInfo>>;
}
