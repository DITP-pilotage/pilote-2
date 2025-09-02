import { MockProxy, mock } from "jest-mock-extended";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { toISODate } from "@/server/app/domain/Dates";
import { SupprimerPropositionValeurAvancementUseCase } from "@/server/indicateur-territoire-valeur-evenement/usecases/SupprimerPropositionValeurAvancementUseCase";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { InMemoryTransaction, Transaction } from "@/server/db/Transaction";

describe("#SupprimerPropositionValeurAvancementUseCase", () => {
  let supprimerPropositionValeurAvancementUseCase: SupprimerPropositionValeurAvancementUseCase;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let transaction: Transaction;

  beforeEach(() => {
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    transaction = new InMemoryTransaction();
    supprimerPropositionValeurAvancementUseCase =
      new SupprimerPropositionValeurAvancementUseCase({
        indicateurTerritoireValeurEvenementRepository,
        indicateurRepository,
        transaction,
      });
  });

  it("Doit supprimer une proposition de valeur d'avancement", async () => {
    // Given
    const input = {
      indicId: "IND-006",
      territoireCode: "DEPT-34",
      dateValeurAvancement: new Date("2024-06-08"),
      idAuteurModification: "ec8f2bc3-8f6b-4de2-bbde-1ab790804d43",
      motif: "motif de la suppression",
    };

    const evenementsExistants = [
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: input.dateValeurAvancement,
          valeur: 10,
          idAuteurModification: "user-1",
          correlationId: "corr-1",
          ordre: 1,
          dateCreation: new Date("2024-06-08"),
          donneesComplementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        },
      ),
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_MODIFIEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: input.dateValeurAvancement,
          valeur: 20,
          idAuteurModification: "user-2",
          correlationId: "corr-2",
          ordre: 2,
          dateCreation: new Date("2024-06-08"),
          donneesComplementaires: {
            motif: "Motif de la modification",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        },
      ),
    ];

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      new EvenementsSurDate({
        identifiantFlux: {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          date: toISODate(input.dateValeurAvancement),
        },
        evenementsSurDate: evenementsExistants,
        tousLesEvenements: evenementsExistants,
      }),
    );

    // When
    await supprimerPropositionValeurAvancementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        typeEvenement: "PROPOSITION_VALEUR_SUPPRIMEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: input.dateValeurAvancement,
        valeur: 20,
        idAuteurModification: input.idAuteurModification,
        ordre: 3,
        donneesComplementaires: { motif: "motif de la suppression" },
      }),
    );
    expect(
      indicateurRepository.supprimerTauxAvancementProposition,
    ).toHaveBeenCalledWith({
      indicId: input.indicId,
      territoireCode: input.territoireCode,
    });
  });
});
