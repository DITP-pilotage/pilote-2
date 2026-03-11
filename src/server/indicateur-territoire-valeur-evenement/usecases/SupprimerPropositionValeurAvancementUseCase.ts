import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { Transaction } from "@/server/db/Transaction";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import type { Inject } from "@/server/indicateur-territoire-valeur-evenement/module";

export type SupprimerPropositionValeurAvancementInput = {
  indicId: string;
  territoireCode: string;
  dateValeurAvancement: Date;
  idAuteurModification: string;
  motif: string;
};

export class SupprimerPropositionValeurAvancementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  private readonly indicateurRepository: IndicateurRepository;

  private readonly transaction: Transaction;

  constructor({
    indicateurTerritoireValeurEvenementRepository,
    indicateurRepository,
    transaction,
  }: Inject<
    | "indicateurTerritoireValeurEvenementRepository"
    | "indicateurRepository"
    | "transaction"
  >) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.indicateurRepository = indicateurRepository;
    this.transaction = transaction;
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
        donneesComplementaires: {
          motif: input.motif,
        },
      });

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
