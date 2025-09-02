import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { Transaction } from "@/server/db/Transaction";

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
  indicateurRepository: IndicateurRepository;
  transaction: Transaction;
}

export class ModifierPropositionValeurAvancementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  private readonly indicateurRepository: IndicateurRepository;

  private readonly transaction: Transaction;

  constructor({
    indicateurTerritoireValeurEvenementRepository,
    indicateurRepository,
    transaction,
  }: Dependencies) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.indicateurRepository = indicateurRepository;
    this.transaction = transaction;
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

    await this.transaction.run(async () => {
      await this.indicateurRepository.supprimerTauxAvancementProposition({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
      });
      await this.indicateurTerritoireValeurEvenementRepository.enregistrer(
        evenement,
      );
    });
  }
}
