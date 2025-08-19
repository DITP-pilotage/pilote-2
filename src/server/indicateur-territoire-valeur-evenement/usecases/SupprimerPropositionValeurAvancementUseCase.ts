import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export type SupprimerPropositionValeurAvancementInput = {
  indicId: string;
  territoireCode: string;
  dateValeurAvancement: Date;
  idAuteurModification: string;
};

interface Dependencies {
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
}

export class SupprimerPropositionValeurAvancementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  constructor({ indicateurTerritoireValeurEvenementRepository }: Dependencies) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
  }

  async run(input: SupprimerPropositionValeurAvancementInput): Promise<void> {
    const evenementsSurDate =
      await this.indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          dateValeur: input.dateValeurAvancement,
          typeValeur: "VALEUR_AVANCEMENT",
        },
      );

    const evenement =
      evenementsSurDate.creerEvenementPropositionValeurSupprimee({
        auteurId: input.idAuteurModification,
      });

    await this.indicateurTerritoireValeurEvenementRepository.enregistrer(
      evenement,
    );
  }
}
