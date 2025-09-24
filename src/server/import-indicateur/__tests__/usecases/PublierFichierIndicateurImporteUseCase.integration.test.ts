import { captor, mock, MockProxy } from "jest-mock-extended";
import { PublierFichierIndicateurImporteUseCase } from "@/server/import-indicateur/usecases/PublierFichierIndicateurImporteUseCase";
import { MesureIndicateurTemporaireRepository } from "@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface";
import { RapportRepository } from "@/server/import-indicateur/domain/ports/RapportRepository";
import { MesureIndicateurTemporaire } from "@/server/import-indicateur/domain/MesureIndicateurTemporaire";
import { MesureIndicateurTemporaireBuilder } from "@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder";
import { MesureIndicateurRepository } from "@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface";
import { PropositionValeurAvancementRepository } from "@/server/import-indicateur/domain/ports/PropositionValeurAvancementRepository";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { ValeurIndicateurTerritoireEvenementBuilder } from "@/server/import-indicateur/app/builder/ValeurIndicateurTerritoireEvenement.builder";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { EvenementValeurEnum } from "@/server/app/domain/EvenementValeurEnum";

describe("PublierFichierIndicateurImporteUseCase", () => {
  let publierFichierIndicateurImporteUseCase: PublierFichierIndicateurImporteUseCase;
  let mesureIndicateurTemporaireRepository: MockProxy<MesureIndicateurTemporaireRepository>;
  let mesureIndicateurRepository: MesureIndicateurRepository;
  let rapportRepository: RapportRepository;
  let propositionValeurAvancementRepository: PropositionValeurAvancementRepository;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;

  beforeEach(() => {
    mesureIndicateurRepository = mock<MesureIndicateurRepository>();
    mesureIndicateurTemporaireRepository =
      mock<MesureIndicateurTemporaireRepository>();
    rapportRepository = mock<RapportRepository>();
    propositionValeurAvancementRepository =
      mock<PropositionValeurAvancementRepository>();
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    publierFichierIndicateurImporteUseCase =
      new PublierFichierIndicateurImporteUseCase({
        mesureIndicateurTemporaireRepository,
        mesureIndicateurRepository,
        rapportRepository,
        propositionValeurAvancementRepository,
        indicateurTerritoireValeurEvenementRepository,
        transaction: new InMemoryTransaction(),
      });
  });

  it("doit transférer les mesures temporaires des indicateurs vers le repository permanent", async () => {
    // Given
    const mesureIndicateurTemporaireCaptor =
      captor<MesureIndicateurTemporaire[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("30/12/2022")
        .avecMetricType("vi")
        .avecMetricValue("12")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-002")
        .avecMetricDate("31/12/2022")
        .avecMetricType("vc")
        .avecMetricValue("15")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D002")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      mesureIndicateurTemporaireRepository.recupererToutParRapportId,
    ).toHaveBeenNthCalledWith(1, "20a717e6-2de9-428c-b4e7-80f7b9f36ffc");
    expect(mesureIndicateurRepository.sauvegarder).toHaveBeenNthCalledWith(
      1,
      mesureIndicateurTemporaireCaptor,
    );
    expect(
      mesureIndicateurTemporaireRepository.supprimerToutParRapportId,
    ).toHaveBeenNthCalledWith(1, "20a717e6-2de9-428c-b4e7-80f7b9f36ffc");

    const listeMesuresIndicateurs = mesureIndicateurTemporaireCaptor.value;

    expect(listeMesuresIndicateurs).toHaveLength(2);

    expect(listeMesuresIndicateurs[0].id).toBeDefined();
    expect(listeMesuresIndicateurs[0].rapportId).toEqual(
      "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
    );
    expect(listeMesuresIndicateurs[0].indicId).toEqual("IND-001");
    expect(listeMesuresIndicateurs[0].metricDate).toEqual("30/12/2022");
    expect(listeMesuresIndicateurs[0].metricType).toEqual("vi");
    expect(listeMesuresIndicateurs[0].metricValue).toEqual("12");
    expect(listeMesuresIndicateurs[0].zoneId).toEqual("D01");

    expect(listeMesuresIndicateurs[1].id).toBeDefined();
    expect(listeMesuresIndicateurs[1].rapportId).toEqual(
      "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
    );
    expect(listeMesuresIndicateurs[1].indicId).toEqual("IND-002");
    expect(listeMesuresIndicateurs[1].metricDate).toEqual("31/12/2022");
    expect(listeMesuresIndicateurs[1].metricType).toEqual("vc");
    expect(listeMesuresIndicateurs[1].metricValue).toEqual("15");
    expect(listeMesuresIndicateurs[1].zoneId).toEqual("D002");
  });

  it("doit supprimer les propositions de valeurs associés aux va importés", async () => {
    // Given
    const propositionsAModifierCaptor1 = captor<{
      dateValeurImportee: Date;
      indicId: string;
      zoneId: string;
      valeurImportee: number;
    }>();
    const propositionsAModifierCaptor2 = captor<{
      dateValeurImportee: Date;
      indicId: string;
      zoneId: string;
      valeurImportee: number;
    }>();

    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2022-12-01")
        .avecMetricType("va")
        .avecMetricValue("12")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-002")
        .avecMetricDate("2024-12-01")
        .avecMetricType("va")
        .avecMetricValue("11.3")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-002")
        .avecMetricDate("31/12/2022")
        .avecMetricType("vc")
        .avecMetricValue("15")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D02")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [],
    );
    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      mesureIndicateurTemporaireRepository.recupererToutParRapportId,
    ).toHaveBeenNthCalledWith(1, "20a717e6-2de9-428c-b4e7-80f7b9f36ffc");
    expect(
      propositionValeurAvancementRepository.modifierStatutPropositionsValeurAvancementApresImport,
    ).toHaveBeenCalledTimes(2);
    expect(
      propositionValeurAvancementRepository.modifierStatutPropositionsValeurAvancementApresImport,
    ).toHaveBeenNthCalledWith(1, propositionsAModifierCaptor1);
    expect(
      propositionValeurAvancementRepository.modifierStatutPropositionsValeurAvancementApresImport,
    ).toHaveBeenNthCalledWith(2, propositionsAModifierCaptor2);
    expect(
      mesureIndicateurTemporaireRepository.supprimerToutParRapportId,
    ).toHaveBeenNthCalledWith(1, "20a717e6-2de9-428c-b4e7-80f7b9f36ffc");

    const propositionsAModifier1 = propositionsAModifierCaptor1.value;
    const propositionsAModifier2 = propositionsAModifierCaptor2.value;

    expect(propositionsAModifier1.indicId).toEqual("IND-001");
    expect(propositionsAModifier1.zoneId).toEqual("D01");
    expect(propositionsAModifier1.dateValeurImportee).toEqual(
      new Date("2022-12-01"),
    );
    expect(propositionsAModifier1.valeurImportee).toEqual(12);

    expect(propositionsAModifier2.indicId).toEqual("IND-002");
    expect(propositionsAModifier2.zoneId).toEqual("D01");
    expect(propositionsAModifier2.dateValeurImportee).toEqual(
      new Date("2024-12-01"),
    );
    expect(propositionsAModifier2.valeurImportee).toEqual(11.3);
  });

  it("quand la valeur est nouvelle pour le tuple [indicateur, territoire, date, type], doit créer une ligne d'évènement (VALEUR_CREEE)", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-15")
        .avecMetricType("va")
        .avecMetricValue("75")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);

    const evenement = evenementCaptor.value[0];
    expect(evenement.indicId).toEqual("IND-001");
    expect(evenement.territoireCode).toEqual("DEPT-01");
    expect(evenement.typeEvenement).toEqual("VALEUR_CREEE");
    expect(evenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenement.dateValeur).toEqual(new Date("2023-01-15"));
    expect(evenement.valeur).toEqual(75);
    expect(evenement.idAuteurModification).toEqual(
      "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    );
    expect(evenement.ordre).toEqual(1);
  });

  it(`quand la valeur est chaine de caractère vide pour le tuple [indicateur, territoire, date, type], ne doit pas créer d'évènement ${EvenementValeurEnum.VALEUR_CREEE}`, async () => {
    // Given
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-15")
        .avecMetricType("va")
        .avecMetricValue("")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
      .avecIndicId("IND-001")
      .avecTerritoireCode("DEPT-01")
      .avecTypeEvenement("VALEUR_CREEE")
      .avecTypeValeur("VALEUR_AVANCEMENT")
      .avecDateValeur(new Date("2023-01-01"))
      .avecValeur(42)
      .avecOrdre(1)
      .build();

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistant],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, []);
  });

  it(`quand la valeur est chaine de caractère vide pour le tuple [indicateur, territoire, date, type] avec un tuple pour une date antérieur, ne doit pas créer d'évènement (${EvenementValeurEnum.VALEUR_CREEE}, ${EvenementValeurEnum.VALEUR_HISTORISEE})`, async () => {
    // Given
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
      .avecIndicId("IND-001")
      .avecTerritoireCode("DEPT-01")
      .avecTypeEvenement("VALEUR_CREEE")
      .avecTypeValeur("VALEUR_AVANCEMENT")
      .avecDateValeur(new Date("2023-01-15"))
      .avecValeur(42)
      .avecOrdre(1)
      .build();

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistant],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, []);
  });

  it(`quand il existe une valeur pour le tuple [indicateur, territoire, date, type] et que la nouvelle valeur est chaine de caractère vide, doit créer un évènement ${EvenementValeurEnum.VALEUR_MODIFIEE} avec valeur null`, async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-15")
        .avecMetricType("va")
        .avecMetricValue("")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
      .avecIndicId("IND-001")
      .avecTerritoireCode("DEPT-01")
      .avecTypeEvenement("VALEUR_CREEE")
      .avecTypeValeur("VALEUR_AVANCEMENT")
      .avecDateValeur(new Date("2023-01-15"))
      .avecValeur(42)
      .avecOrdre(1)
      .build();

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistant],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);

    const evenementHistorise = evenementCaptor.value[0];
    expect(evenementHistorise.indicId).toEqual("IND-001");
    expect(evenementHistorise.territoireCode).toEqual("DEPT-01");
    expect(evenementHistorise.typeEvenement).toEqual("VALEUR_MODIFIEE");
    expect(evenementHistorise.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementHistorise.dateValeur).toEqual(new Date("2023-01-15"));
    expect(evenementHistorise.valeur).toEqual(null);
    expect(evenementHistorise.ordre).toEqual(2);
  });

  it(`quand la valeur est nouvelle pour le tuple [indicateur, territoire, date, type] et que la valeur est null, et un nouveau tuple pour une date supérieure et valeur non null dans le même import, doit créer 2 lignes d'évènement (${EvenementValeurEnum.VALEUR_CREEE} + ${EvenementValeurEnum.VALEUR_HISTORISEE})`, async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("42")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-02-01")
        .avecMetricType("va")
        .avecMetricValue("10")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);

    const evenementCreeJanvier = evenementCaptor.value[0];
    expect(evenementCreeJanvier.indicId).toEqual("IND-001");
    expect(evenementCreeJanvier.territoireCode).toEqual("DEPT-01");
    expect(evenementCreeJanvier.typeEvenement).toEqual(
      EvenementValeurEnum.VALEUR_CREEE,
    );
    expect(evenementCreeJanvier.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementCreeJanvier.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementCreeJanvier.valeur).toEqual(42);
    expect(evenementCreeJanvier.ordre).toEqual(1);

    const evenementModifieANullJanvier = evenementCaptor.value[1];
    expect(evenementModifieANullJanvier.indicId).toEqual("IND-001");
    expect(evenementModifieANullJanvier.territoireCode).toEqual("DEPT-01");
    expect(evenementModifieANullJanvier.typeEvenement).toEqual(
      EvenementValeurEnum.VALEUR_MODIFIEE,
    );
    expect(evenementModifieANullJanvier.typeValeur).toEqual(
      "VALEUR_AVANCEMENT",
    );
    expect(evenementModifieANullJanvier.dateValeur).toEqual(
      new Date("2023-01-01"),
    );
    expect(evenementModifieANullJanvier.valeur).toEqual(null);
    expect(evenementModifieANullJanvier.ordre).toEqual(2);

    const evenementHistoriseJanvier = evenementCaptor.value[3];
    expect(evenementHistoriseJanvier.indicId).toEqual("IND-001");
    expect(evenementHistoriseJanvier.territoireCode).toEqual("DEPT-01");
    expect(evenementHistoriseJanvier.typeEvenement).toEqual(
      EvenementValeurEnum.VALEUR_HISTORISEE,
    );
    expect(evenementHistoriseJanvier.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementHistoriseJanvier.dateValeur).toEqual(
      new Date("2023-01-01"),
    );
    expect(evenementHistoriseJanvier.valeur).toEqual(null);
    expect(evenementHistoriseJanvier.ordre).toEqual(3);

    const evenementHistoriseFevrier = evenementCaptor.value[4];
    expect(evenementHistoriseFevrier.indicId).toEqual("IND-001");
    expect(evenementHistoriseFevrier.territoireCode).toEqual("DEPT-01");
    expect(evenementHistoriseFevrier.typeEvenement).toEqual(
      EvenementValeurEnum.VALEUR_HISTORISEE,
    );
    expect(evenementHistoriseFevrier.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementHistoriseFevrier.dateValeur).toEqual(
      new Date("2023-02-01"),
    );
    expect(evenementHistoriseFevrier.valeur).toEqual(10);
    expect(evenementHistoriseFevrier.ordre).toEqual(1);
  });

  it("quand la valeur est nouvelle pour le tuple [indicateur, territoire, date, type] avec un tuple pour une date antérieure, doit créer 2 lignes d'évènement (VALEUR_HISTORISEE + VALEUR_CREEE)", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-02-01")
        .avecMetricType("va")
        .avecMetricValue("75")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
      .avecIndicId("IND-001")
      .avecTerritoireCode("DEPT-01")
      .avecTypeEvenement("VALEUR_CREEE")
      .avecTypeValeur("VALEUR_AVANCEMENT")
      .avecDateValeur(new Date("2023-01-01"))
      .avecValeur(42)
      .avecOrdre(1)
      .build();

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistant],
    );
    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);

    const evenementHistorise = evenementCaptor.value[0];
    expect(evenementHistorise.indicId).toEqual("IND-001");
    expect(evenementHistorise.territoireCode).toEqual("DEPT-01");
    expect(evenementHistorise.typeEvenement).toEqual("VALEUR_HISTORISEE");
    expect(evenementHistorise.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementHistorise.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementHistorise.valeur).toEqual(42);
    expect(evenementHistorise.ordre).toEqual(2);

    const evenementCree = evenementCaptor.value[1];
    expect(evenementCree.indicId).toEqual("IND-001");
    expect(evenementCree.territoireCode).toEqual("DEPT-01");
    expect(evenementCree.typeEvenement).toEqual("VALEUR_CREEE");
    expect(evenementCree.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementCree.dateValeur).toEqual(new Date("2023-02-01"));
    expect(evenementCree.valeur).toEqual(75);
    expect(evenementCree.ordre).toEqual(1);
  });

  it("quand la valeur est nouvelle pour le tuple [indicateur, territoire, date, type] avec un tuple pour une date supérieure, doit créer 2 lignes d'évènement (VALEUR_CREEE + VALEUR_HISTORISEE)", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("75")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
      .avecIndicId("IND-001")
      .avecTerritoireCode("DEPT-01")
      .avecTypeEvenement("VALEUR_CREEE")
      .avecTypeValeur("VALEUR_AVANCEMENT")
      .avecDateValeur(new Date("2023-02-01"))
      .build();

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistant],
    );
    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);
    expect(evenementCaptor.value).toHaveLength(2);

    const evenementCree = evenementCaptor.value[0];
    expect(evenementCree.indicId).toEqual("IND-001");
    expect(evenementCree.territoireCode).toEqual("DEPT-01");
    expect(evenementCree.typeEvenement).toEqual("VALEUR_CREEE");
    expect(evenementCree.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementCree.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementCree.valeur).toEqual(75);
    expect(evenementCree.ordre).toEqual(1);

    const evenementHistorise = evenementCaptor.value[1];
    expect(evenementHistorise.indicId).toEqual("IND-001");
    expect(evenementHistorise.territoireCode).toEqual("DEPT-01");
    expect(evenementHistorise.typeEvenement).toEqual("VALEUR_HISTORISEE");
    expect(evenementHistorise.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementHistorise.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementHistorise.valeur).toEqual(75);
    expect(evenementHistorise.ordre).toEqual(2);
  });

  it("quand la valeur est différente de la dernière valeur importée pour le tuple [indicateur, territoire, date, type], doit créer une ligne d'évènement (VALEUR_MODIFIEE)", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("85")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
      .avecIndicId("IND-001")
      .avecTerritoireCode("DEPT-01")
      .avecTypeEvenement("VALEUR_CREEE")
      .avecTypeValeur("VALEUR_AVANCEMENT")
      .avecDateValeur(new Date("2023-01-01"))
      .avecValeur(42)
      .avecOrdre(1)
      .build();

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistant],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);
    expect(evenementCaptor.value).toHaveLength(1);

    const evenement = evenementCaptor.value[0];
    expect(evenement.indicId).toEqual("IND-001");
    expect(evenement.territoireCode).toEqual("DEPT-01");
    expect(evenement.typeEvenement).toEqual("VALEUR_MODIFIEE");
    expect(evenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenement.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenement.valeur).toEqual(85);
    expect(evenement.ordre).toEqual(2);
  });

  it("quand la valeur est identique à la dernière valeur importée pour le tuple [indicateur, territoire, date, type], ne doit pas créer de ligne d'évènement", async () => {
    // Given
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("75")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    const evenementExistant = new ValeurIndicateurTerritoireEvenementBuilder()
      .avecIndicId("IND-001")
      .avecTerritoireCode("DEPT-01")
      .avecTypeEvenement("VALEUR_CREEE")
      .avecTypeValeur("VALEUR_AVANCEMENT")
      .avecDateValeur(new Date("2023-01-01"))
      .avecValeur(75)
      .build();

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistant],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, []);
  });

  it("quand plusieurs valeurs pour le même indicateur/territoire sont importées dans le même batch, doit tenir compte des événements créés précédemment dans le batch", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      // Première valeur - nouvelle date, devrait créer VALEUR_CREEE
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("75")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
      // Deuxième valeur - date postérieure, devrait historiser la première et créer une nouvelle
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-02-01")
        .avecMetricType("va")
        .avecMetricValue("85")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
      // Troisième valeur - première date, devrait créer VALEUR_MODIFIEE
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("85")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [],
    );
    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);

    const evenements = evenementCaptor.value;

    // EXPECTED: Devrait créer 3 événements:
    // 1. VALEUR_CREEE pour 2023-01-01 (valeur: 75)
    // 2. VALEUR_HISTORISEE pour 2023-01-01 (valeur: 75) - car la deuxième valeur a une date postérieure
    // 3. VALEUR_CREEE pour 2023-02-01 (valeur: 85)
    // 4. VALEUR_MODIFIEE pour 2023-01-01 (valeur: 85)
    expect(evenements).toHaveLength(4);

    expect(evenements[0].dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenements[0].typeEvenement).toEqual("VALEUR_CREEE");
    expect(evenements[0].valeur).toEqual(75);
    expect(evenements[0].ordre).toEqual(1);

    expect(evenements[1].dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenements[1].typeEvenement).toEqual("VALEUR_HISTORISEE");
    expect(evenements[1].valeur).toEqual(75);
    expect(evenements[1].ordre).toEqual(2);

    expect(evenements[2].dateValeur).toEqual(new Date("2023-02-01"));
    expect(evenements[2].typeEvenement).toEqual("VALEUR_CREEE");
    expect(evenements[2].valeur).toEqual(85);
    expect(evenements[2].ordre).toEqual(1);

    expect(evenements[3].dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenements[3].typeEvenement).toEqual("VALEUR_MODIFIEE");
    expect(evenements[3].valeur).toEqual(85);
    expect(evenements[3].ordre).toEqual(3);
  });

  it("quand une nouvelle valeur est importée et qu'il existe un évènement PROPOSITION_VALEUR_CREEE pour le tuple [indicateur, territoire, date, type], doit créer les évènements PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE et VALEUR_MODIFIEE", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("85")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    const evenementExistantValeur =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

    const evenementExistantProposition =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(90)
        .avecOrdre(2)
        .build();

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistantValeur, evenementExistantProposition],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);
    expect(evenementCaptor.value).toHaveLength(2);

    const evenementIgnore = evenementCaptor.value[0];
    expect(evenementIgnore).toBeDefined();
    expect(evenementIgnore.indicId).toEqual("IND-001");
    expect(evenementIgnore.territoireCode).toEqual("DEPT-01");
    expect(evenementIgnore.typeEvenement).toEqual(
      "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
    );
    expect(evenementIgnore.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementIgnore.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementIgnore.valeur).toEqual(85);
    expect(evenementIgnore.ordre).toEqual(3);

    const evenementModifie = evenementCaptor.value[1];
    expect(evenementModifie).toBeDefined();
    expect(evenementModifie.indicId).toEqual("IND-001");
    expect(evenementModifie.territoireCode).toEqual("DEPT-01");
    expect(evenementModifie.typeEvenement).toEqual("VALEUR_MODIFIEE");
    expect(evenementModifie.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementModifie.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementModifie.valeur).toEqual(85);
    expect(evenementModifie.ordre).toEqual(4);
  });

  it("quand une nouvelle valeur est importée et qu'il existe un évènement PROPOSITION_VALEUR_MODIFIEE avec une valeur différente pour le tuple [indicateur, territoire, date, type], doit créer les évènements PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE et VALEUR_MODIFIEE", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("85")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    const evenementExistantValeur =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

    const evenementExistantProposition =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("PROPOSITION_VALEUR_MODIFIEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(95)
        .avecOrdre(2)
        .build();

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistantValeur, evenementExistantProposition],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);
    expect(evenementCaptor.value).toHaveLength(2);

    const evenementIgnore = evenementCaptor.value[0];
    expect(evenementIgnore).toBeDefined();
    expect(evenementIgnore.indicId).toEqual("IND-001");
    expect(evenementIgnore.territoireCode).toEqual("DEPT-01");
    expect(evenementIgnore.typeEvenement).toEqual(
      "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
    );
    expect(evenementIgnore.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementIgnore.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementIgnore.valeur).toEqual(85);
    expect(evenementIgnore.ordre).toEqual(3);

    const evenementModifie = evenementCaptor.value[1];
    expect(evenementModifie).toBeDefined();
    expect(evenementModifie.indicId).toEqual("IND-001");
    expect(evenementModifie.territoireCode).toEqual("DEPT-01");
    expect(evenementModifie.typeEvenement).toEqual("VALEUR_MODIFIEE");
    expect(evenementModifie.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementModifie.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementModifie.valeur).toEqual(85);
    expect(evenementModifie.ordre).toEqual(4);
  });

  it("quand une nouvelle valeur est importée et qu'il existe un évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION avec une valeur différente pour le tuple [indicateur, territoire, date, type], doit créer les évènements PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE et VALEUR_MODIFIEE", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("85")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    const evenementExistantValeur =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

    const evenementExistantPropositionModifiee =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(95)
        .avecOrdre(2)
        .build();

    const evenementExistantPropositionAccuseeReception =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("PROPOSITION_VALEUR_ACCUSEE_RECEPTION")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(95)
        .avecOrdre(3)
        .build();

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [
        evenementExistantValeur,
        evenementExistantPropositionModifiee,
        evenementExistantPropositionAccuseeReception,
      ],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);
    expect(evenementCaptor.value).toHaveLength(2);

    const evenementIgnore = evenementCaptor.value[0];
    expect(evenementIgnore).toBeDefined();
    expect(evenementIgnore.indicId).toEqual("IND-001");
    expect(evenementIgnore.territoireCode).toEqual("DEPT-01");
    expect(evenementIgnore.typeEvenement).toEqual(
      "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
    );
    expect(evenementIgnore.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementIgnore.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementIgnore.valeur).toEqual(85);
    expect(evenementIgnore.ordre).toEqual(4);

    const evenementModifie = evenementCaptor.value[1];
    expect(evenementModifie).toBeDefined();
    expect(evenementModifie.indicId).toEqual("IND-001");
    expect(evenementModifie.territoireCode).toEqual("DEPT-01");
    expect(evenementModifie.typeEvenement).toEqual("VALEUR_MODIFIEE");
    expect(evenementModifie.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementModifie.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementModifie.valeur).toEqual(85);
    expect(evenementModifie.ordre).toEqual(5);
  });

  it("quand une nouvelle valeur est importée et qu'il existe un évènement VALEUR_CREE avec la même valeur pour le tuple [indicateur, territoire, date, type], ne doit pas créer d'évènement", async () => {
    // Given
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("75")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    const evenementExistantValeur =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

    const evenementExistantProposition =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(85)
        .avecOrdre(2)
        .build();

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistantValeur, evenementExistantProposition],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, []);
  });

  it("quand une nouvelle valeur est importée et qu'il existe un évènement VALEUR_MODIFIEE avec la même valeur, ne doit pas créer d'évènement", async () => {
    // Given
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-01")
        .avecMetricType("va")
        .avecMetricValue("75")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    const evenementExistantValeur =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

    const evenementExistantProposition =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("PROPOSITION_VALEUR_MODIFIEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(85)
        .avecOrdre(2)
        .build();

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistantValeur, evenementExistantProposition],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, []);
  });

  it("quand une nouvelle valeur est importée et qu'il existe un évènement PROPOSITION_VALEUR_CREEE avec une valeur différente pour une date antérieure, doit créer les évènements PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE et VALEUR_CREEE", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-02-01")
        .avecMetricType("va")
        .avecMetricValue("90")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    const evenementExistantValeur =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

    const evenementExistantProposition =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(80)
        .avecOrdre(2)
        .build();

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistantValeur, evenementExistantProposition],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);

    const evenementIgnore = evenementCaptor.value[0];
    expect(evenementIgnore).toBeDefined();
    expect(evenementIgnore.indicId).toEqual("IND-001");
    expect(evenementIgnore.territoireCode).toEqual("DEPT-01");
    expect(evenementIgnore.typeEvenement).toEqual(
      "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
    );
    expect(evenementIgnore.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementIgnore.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementIgnore.valeur).toEqual(80);
    expect(evenementIgnore.ordre).toEqual(3);

    const evenementHistorise = evenementCaptor.value[1];
    expect(evenementHistorise).toBeDefined();
    expect(evenementHistorise.indicId).toEqual("IND-001");
    expect(evenementHistorise.territoireCode).toEqual("DEPT-01");
    expect(evenementHistorise.typeEvenement).toEqual("VALEUR_HISTORISEE");
    expect(evenementHistorise.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementHistorise.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementHistorise.valeur).toEqual(75);
    expect(evenementHistorise.ordre).toEqual(4);

    const evenementCree = evenementCaptor.value[2];
    expect(evenementCree).toBeDefined();
    expect(evenementCree.indicId).toEqual("IND-001");
    expect(evenementCree.territoireCode).toEqual("DEPT-01");
    expect(evenementCree.typeEvenement).toEqual("VALEUR_CREEE");
    expect(evenementCree.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementCree.dateValeur).toEqual(new Date("2023-02-01"));
    expect(evenementCree.valeur).toEqual(90);
    expect(evenementCree.ordre).toEqual(1);
  });

  it("quand une nouvelle valeur est importée et qu'il existe un évènement PROPOSITION_VALEUR_MODIFIEE avec une valeur différente pour une date antérieure, doit créer les évènements PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE et VALEUR_CREEE", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-02-01")
        .avecMetricType("va")
        .avecMetricValue("95")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    const evenementExistantValeur =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

    const evenementExistantProposition =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("PROPOSITION_VALEUR_MODIFIEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(85)
        .avecOrdre(2)
        .build();

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [evenementExistantValeur, evenementExistantProposition],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);
    expect(evenementCaptor.value).toHaveLength(3);

    const evenementIgnore = evenementCaptor.value[0];
    expect(evenementIgnore).toBeDefined();
    expect(evenementIgnore.indicId).toEqual("IND-001");
    expect(evenementIgnore.territoireCode).toEqual("DEPT-01");
    expect(evenementIgnore.typeEvenement).toEqual(
      "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
    );
    expect(evenementIgnore.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementIgnore.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementIgnore.valeur).toEqual(85);
    expect(evenementIgnore.ordre).toEqual(3);

    const evenementHistorise = evenementCaptor.value[1];
    expect(evenementHistorise).toBeDefined();
    expect(evenementHistorise.indicId).toEqual("IND-001");
    expect(evenementHistorise.territoireCode).toEqual("DEPT-01");
    expect(evenementHistorise.typeEvenement).toEqual("VALEUR_HISTORISEE");
    expect(evenementHistorise.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementHistorise.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementHistorise.valeur).toEqual(75);
    expect(evenementHistorise.ordre).toEqual(4);

    const evenementCree = evenementCaptor.value[2];
    expect(evenementCree).toBeDefined();
    expect(evenementCree.indicId).toEqual("IND-001");
    expect(evenementCree.territoireCode).toEqual("DEPT-01");
    expect(evenementCree.typeEvenement).toEqual("VALEUR_CREEE");
    expect(evenementCree.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementCree.dateValeur).toEqual(new Date("2023-02-01"));
    expect(evenementCree.valeur).toEqual(95);
    expect(evenementCree.ordre).toEqual(1);
  });

  it("quand une nouvelle valeur est importée et qu'il existe un évènement PROPOSITION_VALEUR_ACCUSEE_RECEPTION avec une valeur différente pour une date antérieure, doit créer les évènements PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE et VALEUR_CREEE", async () => {
    // Given
    const evenementCaptor = captor<IndicateurTerritoireValeurEvenement[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-02-01")
        .avecMetricType("va")
        .avecMetricValue("90")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D01")
        .build(),
    ];

    const evenementExistantValeur =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(75)
        .avecOrdre(1)
        .build();

    const evenementExistantPropositionCreee =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(80)
        .avecOrdre(2)
        .build();

    const evenementExistantPropositionAccuseeReception =
      new ValeurIndicateurTerritoireEvenementBuilder()
        .avecIndicId("IND-001")
        .avecTerritoireCode("DEPT-01")
        .avecTypeEvenement("PROPOSITION_VALEUR_CREEE")
        .avecTypeValeur("VALEUR_AVANCEMENT")
        .avecDateValeur(new Date("2023-01-01"))
        .avecValeur(80)
        .avecOrdre(3)
        .build();

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );
    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeEtTypeValeur.mockResolvedValue(
      [
        evenementExistantValeur,
        evenementExistantPropositionCreee,
        evenementExistantPropositionAccuseeReception,
      ],
    );

    // When
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
      auteurId: "2cde2d5a-a575-48ba-9f18-b450d1aa3f60",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);

    const evenementIgnore = evenementCaptor.value[0];
    expect(evenementIgnore).toBeDefined();
    expect(evenementIgnore.indicId).toEqual("IND-001");
    expect(evenementIgnore.territoireCode).toEqual("DEPT-01");
    expect(evenementIgnore.typeEvenement).toEqual(
      "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
    );
    expect(evenementIgnore.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementIgnore.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementIgnore.valeur).toEqual(80);
    expect(evenementIgnore.ordre).toEqual(4);

    const evenementHistorise = evenementCaptor.value[1];
    expect(evenementHistorise).toBeDefined();
    expect(evenementHistorise.indicId).toEqual("IND-001");
    expect(evenementHistorise.territoireCode).toEqual("DEPT-01");
    expect(evenementHistorise.typeEvenement).toEqual("VALEUR_HISTORISEE");
    expect(evenementHistorise.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementHistorise.dateValeur).toEqual(new Date("2023-01-01"));
    expect(evenementHistorise.valeur).toEqual(75);
    expect(evenementHistorise.ordre).toEqual(5);

    const evenementCree = evenementCaptor.value[2];
    expect(evenementCree).toBeDefined();
    expect(evenementCree.indicId).toEqual("IND-001");
    expect(evenementCree.territoireCode).toEqual("DEPT-01");
    expect(evenementCree.typeEvenement).toEqual("VALEUR_CREEE");
    expect(evenementCree.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementCree.dateValeur).toEqual(new Date("2023-02-01"));
    expect(evenementCree.valeur).toEqual(90);
    expect(evenementCree.ordre).toEqual(1);
  });
});
