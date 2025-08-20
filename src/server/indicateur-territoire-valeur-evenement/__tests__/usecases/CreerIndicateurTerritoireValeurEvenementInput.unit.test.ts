import { MockProxy, mock } from "jest-mock-extended";
import { CreerIndicateurTerritoireValeurEvenementUseCase } from "@/server/indicateur-territoire-valeur-evenement/usecases/CreerIndicateurTerritoireValeurEvenementUseCase";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { toISODate } from "@/server/app/domain/Dates";

describe("CreerIndicateurTerritoireValeurEvenementUseCase", () => {
  let creerIndicateurTerritoireValeurEvenementUseCase: CreerIndicateurTerritoireValeurEvenementUseCase;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;

  beforeEach(() => {
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    creerIndicateurTerritoireValeurEvenementUseCase =
      new CreerIndicateurTerritoireValeurEvenementUseCase({
        indicateurTerritoireValeurEvenementRepository,
      });
  });

  it("Doit créer un événement indicateur territoire valeur avec les bonnes propriétés", async () => {
    // Given
    const input = {
      indicId: "IND-001",
      territoireCode: "REG-01",
      valeurAvancement: 75.5,
      dateValeurAvancement: new Date("2024-01-15"),
      idAuteurModification: "user-123",
      motif: "Motif de la proposition",
      sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
    };

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      new EvenementsSurDate({
        identifiantFlux: {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          date: toISODate(input.dateValeurAvancement),
        },
        evenementsSurDate: [],
        tousLesEvenements: [],
      }),
    );

    // When
    await creerIndicateurTerritoireValeurEvenementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        typeEvenement: "PROPOSITION_VALEUR_CREEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: input.dateValeurAvancement,
        valeur: input.valeurAvancement,
        idAuteurModification: input.idAuteurModification,
        ordre: 1,
        donneesComplementaires: {
          motif: input.motif,
          sourceDonneeEtMethodeCalcul: input.sourceDonneeEtMethodeCalcul,
        },
      }),
    );
  });

  it("Doit récupérer les événements existants avec les bons paramètres", async () => {
    // Given
    const input = {
      indicId: "IND-004",
      territoireCode: "REG-02",
      valeurAvancement: 85,
      dateValeurAvancement: new Date("2024-04-05"),
      idAuteurModification: "user-abc",
      motif: "Motif de la proposition",
      sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
    };

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      new EvenementsSurDate({
        identifiantFlux: {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          date: toISODate(input.dateValeurAvancement),
        },
        evenementsSurDate: [],
        tousLesEvenements: [],
      }),
    );

    // When
    await creerIndicateurTerritoireValeurEvenementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate,
    ).toHaveBeenCalledWith({
      indicId: input.indicId,
      territoireCode: input.territoireCode,
      typeValeur: "VALEUR_AVANCEMENT",
      dateValeur: input.dateValeurAvancement,
    });
  });

  it("Doit utiliser ordre 1 quand aucun événement existe", async () => {
    // Given
    const input = {
      indicId: "IND-005",
      territoireCode: "DEP-69",
      valeurAvancement: 40,
      dateValeurAvancement: new Date("2024-05-12"),
      idAuteurModification: "user-def",
      motif: "Motif de la proposition",
      sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
    };

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      new EvenementsSurDate({
        identifiantFlux: {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          date: toISODate(input.dateValeurAvancement),
        },
        evenementsSurDate: [],
        tousLesEvenements: [],
      }),
    );

    // When
    await creerIndicateurTerritoireValeurEvenementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        ordre: 1,
      }),
    );
  });

  it("Doit calculer le prochain ordre quand des événements existent", async () => {
    // Given
    const input = {
      indicId: "IND-006",
      territoireCode: "COM-13001",
      valeurAvancement: 90,
      dateValeurAvancement: new Date("2024-06-08"),
      idAuteurModification: "user-ghi",
      motif: "Motif de la proposition",
      sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
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
            motif: input.motif,
            sourceDonneeEtMethodeCalcul: input.sourceDonneeEtMethodeCalcul,
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
            motif: "Motif de la modification",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        },
      ),

      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_SUPPRIMEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2024-02-01"),
          valeur: 20,
          idAuteurModification: "user-2",
          correlationId: "corr-2",
          ordre: 3,
          donneesComplementaires: { motif: "motif de la suppression" },
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
    await creerIndicateurTerritoireValeurEvenementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenCalledWith(
      expect.objectContaining<Partial<IndicateurTerritoireValeurEvenement>>({
        ordre: 4, // Max ordre existant (3) + 1
      }),
    );
  });
});
