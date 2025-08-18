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
    idAuteurAcceptation,
    motif,
  }: {
    indicId: string;
    territoireCode: string;
    dateValeurAvancement: string;
    idAuteurAcceptation: string;
    motif: string;
  }) {
    const evenementsSurDate =
      await this.indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate(
        {
          indicId,
          territoireCode,
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date(dateValeurAvancement),
        },
      );

    const evenements =
      evenementsSurDate.creerEvenementPropositionValeurAcceptee({
        auteurId: idAuteurAcceptation,
      });

    await this.indicateurTerritoireValeurEvenementRepository.enregistrerTous(
      evenements,
    );
  }
}
