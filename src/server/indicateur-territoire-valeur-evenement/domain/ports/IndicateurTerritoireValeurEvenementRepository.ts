import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { TypeValeur } from "@/server/indicateur-territoire-valeur-evenement/domain/TypeValeur";

export type PropositionValeurAvancementRapport = {
  indicateurId: string;
  territoireCode: string;
  dateValeurAvancement: string;
  valeurAvancementProposee: string;
  valeurAvancementReference: string;
  nomIndicateur: string;
  uniteIndicateur: string;
  nomTerritoire: string;
};

export interface IndicateurTerritoireValeurEvenementRepository {
  recupererParIndicIdTerritoireCodeEtTypeValeur(args: {
    indicId: string;
    territoireCode: string;
    typeValeur: TypeValeur;
  }): Promise<IndicateurTerritoireValeurEvenement[]>;
  recupererParIndicIdTerritoireCodeTypeValeurEtDate(args: {
    indicId: string;
    territoireCode: string;
    typeValeur: TypeValeur;
    dateValeur: Date;
  }): Promise<EvenementsSurDate>;
  recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA(args: {
    indicId: string;
    territoireCode: string;
    typeValeur: TypeValeur;
    dateValeur: Date;
  }): Promise<EvenementsSurDate[]>;
  recupererHistoriqueParIndicIdEtTerritoireCode(args: {
    indicId: string;
    territoireCode: string;
  }): Promise<IndicateurTerritoireValeurEvenement[]>;
  enregistrer(evenement: IndicateurTerritoireValeurEvenement): Promise<void>;
  enregistrerTous(
    evenements: IndicateurTerritoireValeurEvenement[],
  ): Promise<void>;
  recupererLesPropositionsEnCoursParChantierIds(): Promise<
    Map<string, Map<string, PropositionValeurAvancementRapport[]>>
  >;
}
