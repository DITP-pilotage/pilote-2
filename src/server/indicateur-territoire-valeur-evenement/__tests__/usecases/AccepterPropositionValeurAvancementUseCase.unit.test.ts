import { MockProxy, mock } from "jest-mock-extended";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { AccepterPropositionValeurAvancementUseCase } from "@/server/indicateur-territoire-valeur-evenement/usecases/AccepterPropositionValeurAvancementUseCase";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";

describe("CreerIndicateurTerritoireValeurEvenementUseCase", () => {
  let accepterPropositionValeurAvancementUseCase: AccepterPropositionValeurAvancementUseCase;

  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;

  beforeEach(() => {
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    accepterPropositionValeurAvancementUseCase =
      new AccepterPropositionValeurAvancementUseCase({
        indicateurTerritoireValeurEvenementRepository,
      });
  });

  it("Doit accepter une proposition de valeur d'avancement", async () => {
    // Given
    const input = {
      indicId: "IND-006",
      territoireCode: "COM-13001",
      dateValeurAvancement: "2024-06-08",
      idAuteurAcceptation: "user-ghi",
      motif: "Motif de la proposition",
    };

    const evenementsExistants = [
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2024-01-01"),
          valeur: 10,
          idAuteurModification: "user-1",
          correlationId: "corr-1",
          ordre: 1,
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
          dateValeur: new Date("2024-02-01"),
          valeur: 20,
          idAuteurModification: "user-2",
          correlationId: "corr-2",
          ordre: 2,
          donneesComplementaires: undefined,
        },
      ),
    ];

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      new EvenementsSurDate({
        identifiantFlux: {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          date: input.dateValeurAvancement,
        },
        evenementsSurDate: evenementsExistants,
        tousLesEvenements: evenementsExistants,
      }),
    );

    // When
    await accepterPropositionValeurAvancementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenCalledWith([
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: new Date(input.dateValeurAvancement),
        valeur: 20,
        idAuteurModification: input.idAuteurAcceptation,
        ordre: 3,
        donneesComplementaires: { motif: "Motif de la proposition" },
      }),
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        typeEvenement: "VALEUR_MODIFIEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: new Date(input.dateValeurAvancement),
        valeur: 20,
        idAuteurModification: input.idAuteurAcceptation,
        ordre: 4,
        donneesComplementaires: undefined,
      }),
    ]);
  });
});
