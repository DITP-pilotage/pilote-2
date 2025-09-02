import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { Transaction } from "@/server/db/Transaction";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";

export class RefuserPropositionValeurAvancementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  private readonly indicateurRepository: IndicateurRepository;

  private readonly transaction: Transaction;

  constructor({
    indicateurTerritoireValeurEvenementRepository,
    indicateurRepository,
    transaction,
  }: {
    indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
    indicateurRepository: IndicateurRepository;
    transaction: Transaction;
  }) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.indicateurRepository = indicateurRepository;
    this.transaction = transaction;
  }

  async run({
    indicId,
    territoireCode,
    dateValeurAvancement,
    idAuteurRefus,
    motif,
  }: {
    indicId: string;
    territoireCode: string;
    dateValeurAvancement: string;
    idAuteurRefus: string;
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

    const evenement = evenementsSurDate.creerEvenementPropositionValeurRefusee({
      auteurId: idAuteurRefus,
      motif,
    });

    await this.transaction.run(async () => {
      await this.indicateurRepository.supprimerTauxAvancementProposition({
        indicId: indicId,
        territoireCode: territoireCode,
      });
      await this.indicateurTerritoireValeurEvenementRepository.enregistrerTous([
        evenement,
      ]);
    });
  }
}
