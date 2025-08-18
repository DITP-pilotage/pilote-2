import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export class AccepterPropositionValeurAvancementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  constructor({
    indicateurTerritoireValeurEvenementRepository,
  }: {
    indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  }) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
  }

  async run({
    indicId,
    territoireCode,
    dateValeurAvancement,
    auteurAcceptation,
  }: {
    indicId: string;
    territoireCode: string;
    dateValeurAvancement: string;
    auteurAcceptation: string;
  }) {
    throw new Error("Not implemented");
  }
}
