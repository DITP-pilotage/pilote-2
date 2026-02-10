import { EvenementIndicateur } from "@/server/rapports-hebdomadaires/domain/SectionActiviteChantiers";
import { PeriodeRapport } from "@/server/rapports-hebdomadaires/domain/PeriodeRapport";

export interface ActiviteIndicateurGateway {
  recupererEvenementsDansPeriode(params: {
    indicateurIds: string[];
    territoireCodes: string[];
    periode: PeriodeRapport;
  }): Promise<EvenementIndicateur[]>;
}
