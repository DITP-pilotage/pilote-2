import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";

export type ModifierPropositionValeurAvancementInput = {
  indicId: string;
  territoireCode: string;
  valeurAvancement: number;
  dateValeurAvancement: Date;
  idAuteurModification: string;
  motif: string;
  sourceDonneeEtMethodeCalcul: string;
};

interface Dependencies {
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
}

export class ModifierPropositionValeurAvancementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  constructor({ indicateurTerritoireValeurEvenementRepository }: Dependencies) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
  }

  async run(input: ModifierPropositionValeurAvancementInput): Promise<void> {
    const evenementsSurDate =
      await this.indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          dateValeur: input.dateValeurAvancement,
          typeValeur: "VALEUR_AVANCEMENT",
        },
      );

    const evenement = evenementsSurDate.creerEvenementPropositionValeurModifiee(
      {
        valeur: input.valeurAvancement,
        auteurId: input.idAuteurModification,
        donneesComplementaires: {
          motif: input.motif,
          sourceDonneeEtMethodeCalcul: input.sourceDonneeEtMethodeCalcul,
        },
      },
    );

    await this.indicateurTerritoireValeurEvenementRepository.enregistrer(
      evenement,
    );
  }
}
