import { MockProxy, mock } from "jest-mock-extended";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase } from "@/server/indicateur-territoire-valeur-evenement/usecases/RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";

describe("RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase", () => {
  let useCase: RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;

  beforeEach(() => {
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    useCase = new RecupererHistoriqueIndicateurTerritoireValeurEvenementUseCase(
      {
        indicateurTerritoireValeurEvenementRepository,
      },
    );
  });

  it("Doit retourner un objet vide quand aucun événement n'existe", async () => {
    indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode.mockResolvedValue(
      [],
    );

    const result = await useCase.run({
      indicId: "INDIC_001",
      territoireCode: "FR",
    });

    expect(result).toEqual({});
    expect(
      indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode,
    ).toHaveBeenCalledWith({
      indicId: "INDIC_001",
      territoireCode: "FR",
    });
  });

  it("Doit grouper les événements par dateValeur et les trier correctement", async () => {
    const date1 = new Date("2024-01-01");
    const date2 = new Date("2024-02-01");
    const fixedDateCreation = new Date("2024-03-01T10:00:00.000Z");

    const event1 =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: "INDIC_001",
          territoireCode: "FR",
          typeEvenement: "VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: date2,
          valeur: 10,
          donneesComplementaires: undefined,
          idAuteurModification: "user1",
          correlationId: "corr1",
          ordre: 1,
          dateCreation: fixedDateCreation,
        },
      );

    const event2 =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: "INDIC_001",
          territoireCode: "FR",
          typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: date2,
          valeur: 20,
          donneesComplementaires: {
            motif: "Proposition valeur",
          },
          idAuteurModification: "user1",
          correlationId: "corr2",
          ordre: 2,
          dateCreation: fixedDateCreation,
        },
      );

    const event4 =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: "INDIC_001",
          territoireCode: "FR",
          typeEvenement: "VALEUR_MODIFIEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: date2,
          valeur: 20,
          donneesComplementaires: undefined,
          idAuteurModification: "user1",
          correlationId: "corr2",
          ordre: 2,
          dateCreation: fixedDateCreation,
        },
      );

    const event3 =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: "INDIC_001",
          territoireCode: "FR",
          typeEvenement: "VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: date1,
          valeur: 5,
          donneesComplementaires: undefined,
          idAuteurModification: "user1",
          correlationId: "corr3",
          ordre: 1,
          dateCreation: fixedDateCreation,
        },
      );

    // Le repository retourne les événements triés par date desc, puis ordre desc
    indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode.mockResolvedValue(
      [event2, event1, event3, event4], // date2 (ordre 2), date2 (ordre 1), date1 (ordre 1)
    );

    const result = await useCase.run({
      indicId: "INDIC_001",
      territoireCode: "FR",
    });

    const expectedResult = {
      "2024-02-01T00:00:00.000Z": [
        {
          id: event2.id,
          indicId: event2.indicId,
          territoireCode: event2.territoireCode,
          typeEvenement: event2.typeEvenement,
          typeValeur: event2.typeValeur,
          dateValeur: event2.dateValeur,
          dateCreation: event2.dateCreation,
          valeur: event2.valeur,
          donneesComplementaires: event2.donneesComplementaires,
          idAuteurModification: event2.idAuteurModification,
          correlationId: event2.correlationId,
          ordre: event2.ordre,
        },
        {
          id: event1.id,
          indicId: event1.indicId,
          territoireCode: event1.territoireCode,
          typeEvenement: event1.typeEvenement,
          typeValeur: event1.typeValeur,
          dateValeur: event1.dateValeur,
          dateCreation: event1.dateCreation,
          valeur: event1.valeur,
          donneesComplementaires: event1.donneesComplementaires,
          idAuteurModification: event1.idAuteurModification,
          correlationId: event1.correlationId,
          ordre: event1.ordre,
        },
      ],
      "2024-01-01T00:00:00.000Z": [
        {
          id: event3.id,
          indicId: event3.indicId,
          territoireCode: event3.territoireCode,
          typeEvenement: event3.typeEvenement,
          typeValeur: event3.typeValeur,
          dateValeur: event3.dateValeur,
          dateCreation: event3.dateCreation,
          valeur: event3.valeur,
          donneesComplementaires: event3.donneesComplementaires,
          idAuteurModification: event3.idAuteurModification,
          correlationId: event3.correlationId,
          ordre: event3.ordre,
        },
      ],
    };

    expect(result).toEqual(expectedResult);
    expect(Object.keys(result)).toEqual([
      "2024-02-01T00:00:00.000Z",
      "2024-01-01T00:00:00.000Z",
    ]);
  });

  it("Doit gérer plusieurs événements sur la même date avec un tri correct par ordre décroissant", async () => {
    const date = new Date("2024-01-01");
    const fixedDateCreation = new Date("2024-03-01T10:00:00.000Z");

    const event1 =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: "INDIC_001",
          territoireCode: "FR",
          typeEvenement: "VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: date,
          valeur: 10,
          donneesComplementaires: undefined,
          idAuteurModification: "user1",
          correlationId: "corr1",
          ordre: 1,
          dateCreation: fixedDateCreation,
        },
      );

    const event2 =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: "INDIC_001",
          territoireCode: "FR",
          typeEvenement: "PROPOSITION_VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: date,
          valeur: 20,
          donneesComplementaires: {
            motif: "Proposition valeur cree",
            sourceDonneeEtMethodeCalcul: "source",
          },
          idAuteurModification: "user1",
          correlationId: "corr2",
          ordre: 3,
          dateCreation: fixedDateCreation,
        },
      );

    const event3 =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: "INDIC_001",
          territoireCode: "FR",
          typeEvenement: "VALEUR_HISTORISEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: date,
          valeur: 15,
          donneesComplementaires: undefined,
          idAuteurModification: "user1",
          correlationId: "corr3",
          ordre: 2,
          dateCreation: fixedDateCreation,
        },
      );

    // Le repository retourne les événements triés par date desc, puis ordre desc
    indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode.mockResolvedValue(
      [event2, event3, event1], // ordre 3, ordre 2, ordre 1 (tous sur même date)
    );

    const result = await useCase.run({
      indicId: "INDIC_001",
      territoireCode: "FR",
    });

    expect(result["2024-01-01T00:00:00.000Z"]).toEqual([
      {
        id: event2.id,
        indicId: event2.indicId,
        territoireCode: event2.territoireCode,
        typeEvenement: event2.typeEvenement,
        typeValeur: event2.typeValeur,
        dateValeur: event2.dateValeur,
        valeur: event2.valeur,
        donneesComplementaires: event2.donneesComplementaires,
        idAuteurModification: event2.idAuteurModification,
        correlationId: event2.correlationId,
        dateCreation: fixedDateCreation,
        ordre: event2.ordre,
      },
      {
        id: event3.id,
        indicId: event3.indicId,
        territoireCode: event3.territoireCode,
        typeEvenement: event3.typeEvenement,
        typeValeur: event3.typeValeur,
        dateValeur: event3.dateValeur,
        valeur: event3.valeur,
        donneesComplementaires: event3.donneesComplementaires,
        idAuteurModification: event3.idAuteurModification,
        correlationId: event3.correlationId,
        dateCreation: fixedDateCreation,
        ordre: event3.ordre,
      },
      {
        id: event1.id,
        indicId: event1.indicId,
        territoireCode: event1.territoireCode,
        typeEvenement: event1.typeEvenement,
        typeValeur: event1.typeValeur,
        dateValeur: event1.dateValeur,
        valeur: event1.valeur,
        donneesComplementaires: event1.donneesComplementaires,
        idAuteurModification: event1.idAuteurModification,
        correlationId: event1.correlationId,
        dateCreation: fixedDateCreation,
        ordre: event1.ordre,
      },
    ]);
  });
});
