import { MockProxy, mock } from "jest-mock-extended";
import { CreerIndicateurTerritoireValeurEvenementUseCase } from "@/server/indicateur-territoire-valeur-evenement/usecases/CreerIndicateurTerritoireValeurEvenementUseCase";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";

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
    };

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      [],
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
      }),
    );
  });

  it("Doit appeler le repository une seule fois", async () => {
    // Given
    const input = {
      indicId: "IND-002",
      territoireCode: "DEP-75",
      valeurAvancement: 50,
      dateValeurAvancement: new Date("2024-02-20"),
      idAuteurModification: "user-456",
    };

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      [],
    );

    // When
    await creerIndicateurTerritoireValeurEvenementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenCalledTimes(1);
  });

  it("Doit générer un correlationId et un id unique pour chaque appel", async () => {
    // Given
    const input = {
      indicId: "IND-003",
      territoireCode: "COM-75001",
      valeurAvancement: 25,
      dateValeurAvancement: new Date("2024-03-10"),
      idAuteurModification: "user-789",
    };

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      [],
    );

    // When
    await creerIndicateurTerritoireValeurEvenementUseCase.run(input);
    await creerIndicateurTerritoireValeurEvenementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenCalledTimes(2);

    const firstCall =
      indicateurTerritoireValeurEvenementRepository.enregistrer.mock
        .calls[0][0];
    const secondCall =
      indicateurTerritoireValeurEvenementRepository.enregistrer.mock
        .calls[1][0];

    // Les correlationId doivent être différents
    expect(firstCall.correlationId).not.toBe(secondCall.correlationId);
    // Les id doivent être différents
    expect(firstCall.id).not.toBe(secondCall.id);
  });

  it("Doit récupérer les événements existants avec les bons paramètres", async () => {
    // Given
    const input = {
      indicId: "IND-004",
      territoireCode: "REG-02",
      valeurAvancement: 85,
      dateValeurAvancement: new Date("2024-04-05"),
      idAuteurModification: "user-abc",
    };

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      [],
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
    };

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      [],
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
        },
      ),
    ];

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      evenementsExistants,
    );

    // When
    await creerIndicateurTerritoireValeurEvenementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenCalledWith(
      expect.objectContaining<Partial<IndicateurTerritoireValeurEvenement>>({
        ordre: 3, // Max ordre existant (3) + 1
      }),
    );
  });
});
