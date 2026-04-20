import { MockProxy, mock } from "vitest-mock-extended";
import { CreerPropositionValeurAvancementUseCase } from "@/server/indicateur-territoire-valeur-evenement/usecases/CreerPropositionValeurAvancementUseCase";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { toISODate } from "@/server/app/domain/Dates";

describe("CreerPropositionValeurAvancementUseCase", () => {
  let creerPropositionValeurAvancementUseCase: CreerPropositionValeurAvancementUseCase;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;

  beforeEach(() => {
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    creerPropositionValeurAvancementUseCase =
      new CreerPropositionValeurAvancementUseCase({
        indicateurTerritoireValeurEvenementRepository,
        indicateurRepository,
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

    indicateurRepository.getDateEffectiveValeurAvancement.mockResolvedValue(
      new Date("2024-01-01"),
    );

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

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA.mockResolvedValue(
      [],
    );

    // When
    await creerPropositionValeurAvancementUseCase.run(input);

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

    indicateurRepository.getDateEffectiveValeurAvancement.mockResolvedValue(
      new Date("2024-03-01"),
    );

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

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA.mockResolvedValue(
      [],
    );

    // When
    await creerPropositionValeurAvancementUseCase.run(input);

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

    indicateurRepository.getDateEffectiveValeurAvancement.mockResolvedValue(
      new Date("2024-04-01"),
    );

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

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA.mockResolvedValue(
      [],
    );

    // When
    await creerPropositionValeurAvancementUseCase.run(input);

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

    indicateurRepository.getDateEffectiveValeurAvancement.mockResolvedValue(
      new Date("2024-05-01"),
    );

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
          dateCreation: new Date("2024-06-08"),
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
          dateCreation: new Date("2024-02-01"),
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
          dateCreation: new Date("2024-02-01"),
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

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA.mockResolvedValue(
      [],
    );

    // When
    await creerPropositionValeurAvancementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenCalledWith(
      expect.objectContaining<Partial<IndicateurTerritoireValeurEvenement>>({
        ordre: 4, // Max ordre existant (3) + 1
      }),
    );
  });

  it("Doit échouer quand la date de proposition est inférieure à la date effective de valeur d'avancement", async () => {
    // Given
    const derniereDateValeurAvancement = new Date("2024-06-01");
    const input = {
      indicId: "IND-007",
      territoireCode: "REG-03",
      valeurAvancement: 50,
      dateValeurAvancement: new Date("2024-05-01"), // Date inférieure
      idAuteurModification: "user-xyz",
      motif: "Motif de la proposition",
      sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
    };

    indicateurRepository.getDateEffectiveValeurAvancement.mockResolvedValue(
      derniereDateValeurAvancement,
    );

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

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA.mockResolvedValue(
      [],
    );

    // When / Then
    await expect(
      creerPropositionValeurAvancementUseCase.run(input),
    ).rejects.toThrow();

    expect(
      indicateurRepository.getDateEffectiveValeurAvancement,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
      }),
    );
  });

  it("Doit échouer quand la date de proposition est supérieure à la date du jour", async () => {
    // Given
    const derniereDateValeurAvancement = new Date("2024-06-01");
    const dateValeurAvancement = new Date();
    dateValeurAvancement.setMonth(new Date().getMonth() + 1); // Date dans le futur
    const input = {
      indicId: "IND-007",
      territoireCode: "REG-03",
      valeurAvancement: 50,
      dateValeurAvancement,
      idAuteurModification: "user-xyz",
      motif: "Motif de la proposition",
      sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
    };

    indicateurRepository.getDateEffectiveValeurAvancement.mockResolvedValue(
      derniereDateValeurAvancement,
    );

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

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA.mockResolvedValue(
      [],
    );

    // When / Then
    await expect(
      creerPropositionValeurAvancementUseCase.run(input),
    ).rejects.toThrow();

    expect(
      indicateurRepository.getDateEffectiveValeurAvancement,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
      }),
    );
  });

  it("Doit fonctionner quand la date de proposition est la date du jour", async () => {
    // Given
    const derniereDateValeurAvancement = new Date("2024-06-01");
    const input = {
      indicId: "IND-007",
      territoireCode: "REG-03",
      valeurAvancement: 50,
      dateValeurAvancement: new Date(),
      idAuteurModification: "user-xyz",
      motif: "Motif de la proposition",
      sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
    };

    indicateurRepository.getDateEffectiveValeurAvancement.mockResolvedValue(
      derniereDateValeurAvancement,
    );

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

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA.mockResolvedValue(
      [],
    );

    // When / Then
    await expect(
      creerPropositionValeurAvancementUseCase.run(input),
    ).toResolve();
  });

  it("Doit échouer quand une proposition existe déjà sur une date supérieure ou égale", async () => {
    // Given
    const derniereDateValeurAvancement = new Date("2024-05-01");
    const input = {
      indicId: "IND-008",
      territoireCode: "REG-04",
      valeurAvancement: 60,
      dateValeurAvancement: new Date("2024-06-01"),
      idAuteurModification: "user-abc",
      motif: "Motif de la proposition",
      sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
    };

    indicateurRepository.getDateEffectiveValeurAvancement.mockResolvedValue(
      derniereDateValeurAvancement,
    );

    // Une proposition existe déjà sur une date future
    const propositionExistante =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date("2024-07-01"),
          valeur: 70,
          idAuteurModification: "user-other",
          correlationId: "corr-3",
          ordre: 1,
          dateCreation: new Date("2024-06-15"),
          donneesComplementaires: {
            motif: "Autre proposition",
            sourceDonneeEtMethodeCalcul: "Autre source",
          },
        },
      );

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

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA.mockResolvedValue(
      [
        new EvenementsSurDate({
          identifiantFlux: {
            indicId: input.indicId,
            territoireCode: input.territoireCode,
            date: toISODate(new Date("2024-07-01")),
          },
          evenementsSurDate: [propositionExistante],
          tousLesEvenements: [propositionExistante],
        }),
      ],
    );

    // When / Then
    await expect(
      creerPropositionValeurAvancementUseCase.run(input),
    ).rejects.toThrow();
  });

  it("Doit créer une proposition quand la date est valide et aucune proposition n'existe", async () => {
    // Given
    const derniereDateValeurAvancement = new Date("2024-05-01");
    const input = {
      indicId: "IND-009",
      territoireCode: "REG-05",
      valeurAvancement: 65,
      dateValeurAvancement: new Date("2024-06-01"),
      idAuteurModification: "user-valid",
      motif: "Motif de la proposition",
      sourceDonneeEtMethodeCalcul: "Source de la donnée et méthode de calcul",
    };

    indicateurRepository.getDateEffectiveValeurAvancement.mockResolvedValue(
      derniereDateValeurAvancement,
    );

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

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA.mockResolvedValue(
      [],
    );

    // When
    await creerPropositionValeurAvancementUseCase.run(input);

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDateSuperieureA,
    ).toHaveBeenCalledWith({
      indicId: input.indicId,
      territoireCode: input.territoireCode,
      dateValeur: expect.any(Date),
      typeValeur: "VALEUR_AVANCEMENT",
    });

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
      }),
    );
  });
});
