import { EvenementVA } from "../SectionActiviteChantiersVA";
import { PeriodeRapport } from "../PeriodeRapport";

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
