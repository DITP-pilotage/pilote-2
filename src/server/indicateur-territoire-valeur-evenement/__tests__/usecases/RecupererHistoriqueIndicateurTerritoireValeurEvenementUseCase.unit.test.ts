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
        },
      );

    const event2 =
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
        },
      );

    // Le repository retourne les événements triés par date desc, puis ordre desc
    indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode.mockResolvedValue(
      [event2, event1, event3], // date2 (ordre 2), date2 (ordre 1), date1 (ordre 1)
    );

    const result = await useCase.run({
      indicId: "INDIC_001",
      territoireCode: "FR",
    });

    const expectedResult = {
      "2024-02-01T00:00:00.000Z": [event2, event1],
      "2024-01-01T00:00:00.000Z": [event3],
    };

    expect(result).toEqual(expectedResult);
    expect(Object.keys(result)).toEqual([
      "2024-02-01T00:00:00.000Z",
      "2024-01-01T00:00:00.000Z",
    ]);
  });

  it("Doit gérer plusieurs événements sur la même date avec un tri correct par ordre décroissant", async () => {
    const date = new Date("2024-01-01");

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
        },
      );

    const event2 =
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: "INDIC_001",
          territoireCode: "FR",
          typeEvenement: "VALEUR_MODIFIEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: date,
          valeur: 20,
          donneesComplementaires: undefined,
          idAuteurModification: "user1",
          correlationId: "corr2",
          ordre: 3,
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
      event2,
      event3,
      event1,
    ]);
  });
});
