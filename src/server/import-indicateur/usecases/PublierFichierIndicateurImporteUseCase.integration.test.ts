import { captor, mock, MockProxy } from "jest-mock-extended";
import { PublierFichierIndicateurImporteUseCase } from "@/server/import-indicateur/usecases/PublierFichierIndicateurImporteUseCase";
import { MesureIndicateurTemporaireRepository } from "@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface";
import { RapportRepository } from "@/server/import-indicateur/domain/ports/RapportRepository";
import { MesureIndicateurTemporaire } from "@/server/import-indicateur/domain/MesureIndicateurTemporaire";
import { MesureIndicateurTemporaireBuilder } from "@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder";
import { MesureIndicateurRepository } from "@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface";
import { PropositionValeurAvancementRepository } from "@/server/import-indicateur/domain/ports/PropositionValeurAvancementRepository";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/import-indicateur/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { ValeurIndicateurTerritoireEvenement } from "@/server/import-indicateur/domain/ValeurIndicateurTerritoireEvenement";

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
      });
  });

  it("doit transférer les mesures temporaires des indicateurs vers le repository permanent", async () => {
    // GIVEN
    const mesureIndicateurTemporaireCaptor =
      captor<MesureIndicateurTemporaire[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("30/12/2022")
        .avecMetricType("vi")
        .avecMetricValue("12")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D001")
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
    // WHEN
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
    });

    // THEN
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
    expect(listeMesuresIndicateurs[0].zoneId).toEqual("D001");

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
    // GIVEN
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
    // WHEN
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
    });

    // THEN
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
    // GIVEN
    const evenementCaptor = captor<ValeurIndicateurTerritoireEvenement>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-15")
        .avecMetricType("va")
        .avecMetricValue("75")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D001")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    // WHEN
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
    });

    // THEN
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);

    const evenement = evenementCaptor.value;
    expect(evenement.indicId).toEqual("IND-001");
    expect(evenement.territoireCode).toEqual("D001");
    expect(evenement.typeEvenement).toEqual("VALEUR_CREE");
    expect(evenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenement.dateValeur).toEqual(new Date("2023-01-15"));
  });

  it("quand la valeur est nouvelle pour le tuple [indicateur, territoire, date, type] avec un tuple pour une date antérieure, doit créer 2 lignes d'évènement (VALEUR_HISTORISEE + VALEUR_CREEE)", async () => {
    // GIVEN
    const evenementCaptor1 = captor<ValeurIndicateurTerritoireEvenement>();
    const evenementCaptor2 = captor<ValeurIndicateurTerritoireEvenement>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-15")
        .avecMetricType("va")
        .avecMetricValue("75")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D001")
        .build(),
    ];

    indicateurTerritoireValeurEvenementRepository.recuperer.mockResolvedValue();
    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    // WHEN
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
    });

    // THEN
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenNthCalledWith(1, evenementCaptor1);
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenNthCalledWith(2, evenementCaptor2);

    const evenementHistorise = evenementCaptor1.value;
    expect(evenementHistorise.indicId).toEqual("IND-001");
    expect(evenementHistorise.territoireCode).toEqual("D001");
    expect(evenementHistorise.typeEvenement).toEqual("VALEUR_HISTORISEE");
    expect(evenementHistorise.typeValeur).toEqual("VALEUR_AVANCEMENT");

    const evenementCree = evenementCaptor2.value;
    expect(evenementCree.indicId).toEqual("IND-001");
    expect(evenementCree.territoireCode).toEqual("D001");
    expect(evenementCree.typeEvenement).toEqual("VALEUR_CREE");
    expect(evenementCree.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenementCree.dateValeur).toEqual(new Date("2023-01-15"));
  });

  it("quand la valeur est différente de la dernière valeur importée pour le tuple [indicateur, territoire, date, type], doit créer une ligne d'évènement (VALEUR_MODIFIEE)", async () => {
    // GIVEN
    const evenementCaptor = captor<ValeurIndicateurTerritoireEvenement>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-15")
        .avecMetricType("va")
        .avecMetricValue("85")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D001")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    // WHEN
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
    });

    // THEN
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenCalledTimes(1);
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).toHaveBeenNthCalledWith(1, evenementCaptor);

    const evenement = evenementCaptor.value;
    expect(evenement.indicId).toEqual("IND-001");
    expect(evenement.territoireCode).toEqual("D001");
    expect(evenement.typeEvenement).toEqual("VALEUR_MODIFIEE");
    expect(evenement.typeValeur).toEqual("VALEUR_AVANCEMENT");
    expect(evenement.dateValeur).toEqual(new Date("2023-01-15"));
  });

  it("quand la valeur est identique à la dernière valeur importée pour le tuple [indicateur, territoire, date, type], ne doit pas créer de ligne d'évènement", async () => {
    // GIVEN
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId("IND-001")
        .avecMetricDate("2023-01-15")
        .avecMetricType("va")
        .avecMetricValue("75")
        .avecRapportId("20a717e6-2de9-428c-b4e7-80f7b9f36ffc")
        .avecZoneId("D001")
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(
      listeMesuresIndicateursTemporaires,
    );

    // WHEN
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: "20a717e6-2de9-428c-b4e7-80f7b9f36ffc",
    });

    // THEN
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrer,
    ).not.toHaveBeenCalled();
  });
});
