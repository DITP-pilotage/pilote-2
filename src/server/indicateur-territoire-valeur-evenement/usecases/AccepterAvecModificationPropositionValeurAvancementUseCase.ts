import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { Transaction } from "@/server/db/Transaction";
import { MesureIndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/MesureIndicateurRepository";

export class AccepterAvecModificationPropositionValeurAvancementUseCase {
  private readonly indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;

  private mesureIndicateurRepository: MesureIndicateurRepository;

  private transaction: Transaction;

  constructor({
    indicateurTerritoireValeurEvenementRepository,
    mesureIndicateurRepository,
    transaction,
  }: {
    indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
    mesureIndicateurRepository: MesureIndicateurRepository;
    transaction: Transaction;
  }) {
    this.indicateurTerritoireValeurEvenementRepository =
      indicateurTerritoireValeurEvenementRepository;
    this.mesureIndicateurRepository = mesureIndicateurRepository;
    this.transaction = transaction;
  }

  async run({
    indicId,
    territoireCode,
    dateValeurAvancement,
    idAuteurAcceptation,
    valeur,
  }: {
    indicId: string;
    territoireCode: string;
    dateValeurAvancement: string;
    idAuteurAcceptation: string;
    valeur: number;
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
      evenementsSurDate.creerEvenementPropositionValeurAccepteeAvecModification(
        {
          auteurId: idAuteurAcceptation,
          valeur,
        },
      );

    await this.transaction.run(async () => {
      await this.mesureIndicateurRepository.enregistrer({
        auteurId: idAuteurAcceptation,
        indicId,
        territoireCode,
        dateValeur: new Date(dateValeurAvancement),
        valeur,
      });
      await this.indicateurTerritoireValeurEvenementRepository.enregistrerTous(
        evenements,
      );
    });
  }
}
