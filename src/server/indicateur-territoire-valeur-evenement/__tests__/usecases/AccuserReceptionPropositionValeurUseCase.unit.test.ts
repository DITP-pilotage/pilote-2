import { MockProxy, mock } from "jest-mock-extended";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { AccuserReceptionPropositionValeurUseCase } from "@/server/indicateur-territoire-valeur-evenement/usecases/AccuserReceptionPropositionValeurUseCase";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";

describe("AccuserReceptionPropositionValeurUseCase", () => {
  let accuserReceptionPropositionValeurUseCase: AccuserReceptionPropositionValeurUseCase;

  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;

  beforeEach(() => {
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    accuserReceptionPropositionValeurUseCase =
      new AccuserReceptionPropositionValeurUseCase({
        indicateurTerritoireValeurEvenementRepository,
      });
  });

  it("Doit accuser réception d'une proposition de valeur d'avancement", async () => {
    // Given
    const input = {
      indicId: "IND-006",
      territoireCode: "COM-13001",
      dateValeurAvancement: "2024-06-08",
      idAuteurAccuseReception: "user-ghi",
      motif: "Motif de l'accusé de réception",
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
          donneesComplementaires: {
            motif: "Modification de la proposition",
            sourceDonneeEtMethodeCalcul: "La source",
          },
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
    await accuserReceptionPropositionValeurUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenCalledWith([
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        typeEvenement: "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: new Date(input.dateValeurAvancement),
        valeur: 20,
        idAuteurModification: input.idAuteurAccuseReception,
        ordre: 3,
        donneesComplementaires: { motif: "Motif de l'accusé de réception" },
      }),
    ]);
  });
});
