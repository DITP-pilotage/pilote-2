import { captor, mock, MockProxy } from 'jest-mock-extended';
import {
  VerifierFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/VerifierFichierIndicateurImporteUseCase';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';
import { DetailValidationFichierBuilder } from '@/server/import-indicateur/app/builder/DetailValidationFichier.builder';
import { ErreurValidationFichierBuilder } from '@/server/import-indicateur/app/builder/ErreurValidationFichier.builder';
import {
  MesureIndicateurTemporaireBuilder,
} from '@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder';
import {
  FichierIndicateurValidationService, ValiderFichierPayload,
} from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import {
  MesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface';
import { ErreurValidationFichier } from '@/server/import-indicateur/domain/ErreurValidationFichier';
import {
  ErreurValidationFichierRepository,
} from '@/server/import-indicateur/domain/ports/ErreurValidationFichierRepository';
import { InformationIndicateurBuilder } from '@/server/import-indicateur/app/builder/InformationIndicateurBuilder';
import { IndicateurRepository } from '@/server/import-indicateur/domain/ports/IndicateurRepository';

describe('VerifierFichierIndicateurImporteUseCase', () => {
  let fichierIndicateurValidationService: MockProxy<FichierIndicateurValidationService>;
  let verifierFichierIndicateurImporteUseCase: VerifierFichierIndicateurImporteUseCase;
  let mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;
  let erreurValidationFichierRepository: ErreurValidationFichierRepository;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let rapportRepository: RapportRepository;

  const CHEMIN_COMPLET_DU_FICHIER = 'cheminCompletDuFichier';
  const NOM_DU_FICHIER = 'nomDuFichier';
  const SCHEMA = 'base/schema/url/';
  const METRIC_DATE_1 = '2022-06-12';
  const METRIC_DATE_2 = '2022-12-12';

  beforeEach(() => {
    fichierIndicateurValidationService = mock<FichierIndicateurValidationService>();
    mesureIndicateurTemporaireRepository = mock<MesureIndicateurTemporaireRepository>();
    erreurValidationFichierRepository = mock<ErreurValidationFichierRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    rapportRepository = mock<RapportRepository>();
    verifierFichierIndicateurImporteUseCase = new VerifierFichierIndicateurImporteUseCase({
      fichierIndicateurValidationService,
      mesureIndicateurTemporaireRepository,
      erreurValidationFichierRepository,
      indicateurRepository,
      rapportRepository,
    });
  });

  it("doit appeler le service de validation du fichier d'indicateur importé", async () => {
    // GIVEN
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .build();

    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };
    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    // WHEN
    const result = await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(result.estValide).toEqual(true);
  });

  it("quand l'indicateur possède des informations, doit concaténer le schema en metadata associé à l'indicateur", async () => {
    // GIVEN
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .build();

    const informationIndicateur = new InformationIndicateurBuilder()
      .withIndicId('IND-001')
      .withIndicSchema('schema.json')
      .build();

    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };

    const payloadValiderFichierCaptor = captor<ValiderFichierPayload>();

    indicateurRepository.recupererInformationIndicateurParId.mockResolvedValue(informationIndicateur);
    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    // WHEN
    await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(fichierIndicateurValidationService.validerFichier).toHaveBeenNthCalledWith(1, payloadValiderFichierCaptor);
    const payloadValiderFichier = payloadValiderFichierCaptor.value;
    expect(payloadValiderFichier.schema).toEqual('base/schema/url/schema.json');
  });

  it('quand le fichier est valide, doit sauvegarder les données du fichier contenu dans le rapport', async () => {
    // GIVEN
    const mesureIndicateurTemporaire1 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D001')
      .avecMetricDate(METRIC_DATE_1)
      .avecMetricType('vi')
      .avecMetricValue('72')

      .build();
    const mesureIndicateurTemporaire2 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D007')
      .avecMetricDate(METRIC_DATE_2)
      .avecMetricType('vc')
      .avecMetricValue('14')
      .build();
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeMesuresIndicateurTemporaire(mesureIndicateurTemporaire1, mesureIndicateurTemporaire2)
      .build();
    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };

    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    const indicateurCaptor = captor<MesureIndicateurTemporaire[]>();

    // WHEN
    await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(mesureIndicateurTemporaireRepository.sauvegarder).toHaveBeenNthCalledWith(1, indicateurCaptor);

    const reportFichierData = indicateurCaptor.value;
    expect(reportFichierData).toHaveLength(2);

    expect(reportFichierData[0].id).toBeDefined();
    expect(reportFichierData[0].indicId).toEqual('IND-001');
    expect(reportFichierData[0].zoneId).toEqual('D001');
    expect(reportFichierData[0].metricDate).toEqual(METRIC_DATE_1);
    expect(reportFichierData[0].metricType).toEqual('vi');
    expect(reportFichierData[0].metricValue).toEqual('72');

    expect(reportFichierData[1].id).toBeDefined();
    expect(reportFichierData[1].indicId).toEqual('IND-001');
    expect(reportFichierData[1].zoneId).toEqual('D007');
    expect(reportFichierData[1].metricDate).toEqual(METRIC_DATE_2);
    expect(reportFichierData[1].metricType).toEqual('vc');
    expect(reportFichierData[1].metricValue).toEqual('14');
  });

  it('quand le fichier est invalide, doit sauvegarder les erreurs du fichier contenu dans le rapport', async () => {
    // GIVEN
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecId('a0c086eb-21e2-4f00-9ca8-4b0fcce133ad')
      .avecEstValide(false)
      .avecListeErreursValidation(
        new ErreurValidationFichierBuilder()
          .avecRapportId('a0c086eb-21e2-4f00-9ca8-4b0fcce133ad')
          .avecCellule('None')
          .avecMessage("Un indicateur ne peut etre vide. C'est le cas à la ligne 2")
          .avecNom('Cellule vide')
          .avecNomDuChamp('indic_id')
          .avecNumeroDeLigne(1)
          .avecPositionDeLigne(1)
          .avecPositionDuChamp(1)
          .build(),
        new ErreurValidationFichierBuilder()
          .avecRapportId('a0c086eb-21e2-4f00-9ca8-4b0fcce133ad')
          .avecCellule('IND-02')
          .avecMessage('Indicateur invalide')
          .avecNom('METRIC_INVALIDE')
          .avecNomDuChamp('indic_id')
          .avecNumeroDeLigne(2)
          .avecPositionDeLigne(2)
          .avecPositionDuChamp(2)
          .build())
      .build();
    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };

    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    const indicateurCaptor = captor<ErreurValidationFichier[]>();

    // WHEN
    await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(erreurValidationFichierRepository.sauvegarder).toHaveBeenNthCalledWith(1, indicateurCaptor);

    const reportFichierData = indicateurCaptor.value;
    expect(reportFichierData).toHaveLength(2);

    expect(reportFichierData[0].id).toBeDefined();
    expect(reportFichierData[0].rapportId).toEqual('a0c086eb-21e2-4f00-9ca8-4b0fcce133ad');
    expect(reportFichierData[0].nom).toEqual('Cellule vide');
    expect(reportFichierData[0].cellule).toEqual('None');
    expect(reportFichierData[0].message).toEqual("Un indicateur ne peut etre vide. C'est le cas à la ligne 2");
    expect(reportFichierData[0].nomDuChamp).toEqual('indic_id');
    expect(reportFichierData[0].numeroDeLigne).toEqual(1);
    expect(reportFichierData[0].positionDeLigne).toEqual(1);
    expect(reportFichierData[0].positionDuChamp).toEqual(1);

    expect(reportFichierData[1].id).toBeDefined();
    expect(reportFichierData[1].rapportId).toEqual('a0c086eb-21e2-4f00-9ca8-4b0fcce133ad');
    expect(reportFichierData[1].nom).toEqual('METRIC_INVALIDE');
    expect(reportFichierData[1].cellule).toEqual('IND-02');
    expect(reportFichierData[1].message).toEqual('Indicateur invalide');
    expect(reportFichierData[1].nomDuChamp).toEqual('indic_id');
    expect(reportFichierData[1].numeroDeLigne).toEqual(2);
    expect(reportFichierData[1].positionDeLigne).toEqual(2);
    expect(reportFichierData[1].positionDuChamp).toEqual(2);
  });

  describe('quand le fichier est invalide', () => {
    it('ne doit pas sauvegarder les données du fichier', async () => {
      // GIVEN
      const detailValidationFichier = new DetailValidationFichierBuilder()
        .avecEstValide(false)
        .build();
      const payload = {
        cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
        nomDuFichier: NOM_DU_FICHIER,
        baseSchemaUrl: SCHEMA,
        indicateurId: 'IND-001',
        utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
      };

      fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

      // WHEN
      await verifierFichierIndicateurImporteUseCase.execute(payload);

      // THEN
      expect(mesureIndicateurTemporaireRepository.sauvegarder).not.toBeCalled();
    });

    it("quand l'indic_id est null, ne doit pas controler la valeur de l'indic_id", async () => {
      // GIVEN
      const mesureIndicateurTemporaire1 = new MesureIndicateurTemporaireBuilder()
        .avecIndicId('IND-001')
        .avecZoneId('D001')
        .avecMetricDate(METRIC_DATE_1)
        .avecMetricType('vi')
        .avecMetricValue('72')
        .build();
      const mesureIndicateurTemporaire2 = new MesureIndicateurTemporaireBuilder()
        .avecIndicId(null)
        .avecZoneId('D007')
        .avecMetricDate(METRIC_DATE_2)
        .avecMetricType('vc')
        .avecMetricValue('14')
        .build();
      const detailValidationFichier = new DetailValidationFichierBuilder()
        .avecEstValide(false)
        .avecListeErreursValidation(
          new ErreurValidationFichierBuilder()
            .avecCellule('None')
            .avecMessage('Un indicateur ne peut etre vide. C\'est le cas à la ligne 2.')
            .avecNom('Cellule vide')
            .avecNomDuChamp('indic_id')
            .avecNumeroDeLigne(1)
            .avecPositionDeLigne(1)
            .avecPositionDuChamp(1)
            .build(),
          new ErreurValidationFichierBuilder()
            .avecCellule('IND-02')
            .avecMessage('Indicateur invalide')
            .avecNom('METRIC_INVALIDE')
            .avecNomDuChamp('indic_id')
            .avecNumeroDeLigne(1)
            .avecPositionDeLigne(1)
            .avecPositionDuChamp(1)
            .build(),
        )
        .avecListeMesuresIndicateurTemporaire(mesureIndicateurTemporaire1, mesureIndicateurTemporaire2)
        .build();

      const payload = {
        cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
        nomDuFichier: NOM_DU_FICHIER,
        baseSchemaUrl: SCHEMA,
        indicateurId: 'IND-001',
        utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
      };

      fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

      // WHEN
      const report = await verifierFichierIndicateurImporteUseCase.execute(payload);

      // THEN
      expect(report.estValide).toEqual(false);

      expect(report.listeErreursValidation).toHaveLength(2);
      expect(report.listeErreursValidation[0].nom).toEqual('Cellule vide');
      expect(report.listeErreursValidation[1].nom).toEqual('METRIC_INVALIDE');
    });
    it('quand au moins un indicateur est invalide, doit inclure les erreurs de validation des données du rapport', async () => {
      // GIVEN
      const mesureIndicateurTemporaire1 = new MesureIndicateurTemporaireBuilder()
        .avecIndicId('IND-001')
        .avecZoneId('D001')
        .avecMetricDate(METRIC_DATE_1)
        .avecMetricType('vi')
        .avecMetricValue('72')
        .build();
      const mesureIndicateurTemporaire2 = new MesureIndicateurTemporaireBuilder()
        .avecIndicId('IND-003')
        .avecZoneId('D007')
        .avecMetricDate(METRIC_DATE_2)
        .avecMetricType('vc')
        .avecMetricValue('14')
        .build();
      const detailValidationFichier = new DetailValidationFichierBuilder()
        .avecEstValide(false)
        .avecListeErreursValidation(
          new ErreurValidationFichierBuilder()
            .avecCellule('IND-02')
            .avecMessage('Indicateur invalide')
            .avecNom('METRIC_INVALIDE')
            .avecNomDuChamp('indic_id')
            .avecNumeroDeLigne(1)
            .avecPositionDeLigne(1)
            .avecPositionDuChamp(1)
            .build(),
        )
        .avecListeMesuresIndicateurTemporaire(mesureIndicateurTemporaire1, mesureIndicateurTemporaire2)
        .build();

      const payload = {
        cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
        nomDuFichier: NOM_DU_FICHIER,
        baseSchemaUrl: SCHEMA,
        indicateurId: 'IND-001',
        utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
      };

      fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

      // WHEN
      const report = await verifierFichierIndicateurImporteUseCase.execute(payload);

      // THEN
      expect(report.estValide).toEqual(false);

      expect(report.listeErreursValidation).toHaveLength(2);
      expect(report.listeErreursValidation[0].nom).toEqual('METRIC_INVALIDE');
      expect(report.listeErreursValidation[1].nom).toEqual('Indicateur invalide');
    });
  });

  it('quand le fichier possède des indic_id différent de celui en paramètre, doit remonter un rapport invalide', async () => {
    // GIVEN
    const mesureIndicateurTemporaire1 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D001')
      .avecMetricDate(METRIC_DATE_1)
      .avecMetricType('vi')
      .avecMetricValue('72')
      .build();
    const mesureIndicateurTemporaire2 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-003')
      .avecZoneId('D007')
      .avecMetricDate(METRIC_DATE_2)
      .avecMetricType('vc')
      .avecMetricValue('14')
      .build();
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeMesuresIndicateurTemporaire(mesureIndicateurTemporaire1, mesureIndicateurTemporaire2)
      .build();
    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };

    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    // WHEN
    const report = await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(report.estValide).toEqual(false);
    expect(mesureIndicateurTemporaireRepository.sauvegarder).not.toBeCalled();

    expect(report.listeErreursValidation).toHaveLength(1);
    expect(report.listeErreursValidation[0].cellule).toEqual('IND-003');
    expect(report.listeErreursValidation[0].message).toEqual("L'indicateur IND-003 ne correpond pas à l'indicateur choisis (IND-001)");
    expect(report.listeErreursValidation[0].nomDuChamp).toEqual('indic_id');
    expect(report.listeErreursValidation[0].nom).toEqual('Indicateur invalide');
    expect(report.listeErreursValidation[0].positionDeLigne).toEqual(1);
    expect(report.listeErreursValidation[0].numeroDeLigne).toEqual(2);
    expect(report.listeErreursValidation[0].positionDuChamp).toEqual(-1);
  });

  it('quand le fichier possède des dates invalides, doit remonter un rapport invalide', async () => {
    // GIVEN
    const mesureIndicateurTemporaire1 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecMetricDate('2023-06-31')
      .build();
    const mesureIndicateurTemporaire2 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecMetricDate('2023-02-30')
      .build();
    const mesureIndicateurTemporaire3 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecMetricDate('2023-02-29')
      .build();
    const mesureIndicateurTemporaire4 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecMetricDate('2020-02-29')
      .build();
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeMesuresIndicateurTemporaire(mesureIndicateurTemporaire1, mesureIndicateurTemporaire2, mesureIndicateurTemporaire3, mesureIndicateurTemporaire4)
      .build();
    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };

    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    // WHEN
    const report = await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(report.estValide).toEqual(false);
    expect(mesureIndicateurTemporaireRepository.sauvegarder).not.toBeCalled();

    expect(report.listeErreursValidation).toHaveLength(3);

    expect(report.listeErreursValidation[0].cellule).toEqual('2023-06-31');
    expect(report.listeErreursValidation[0].message).toEqual("La date '2023-06-31' n'est pas une date valide");
    expect(report.listeErreursValidation[0].nomDuChamp).toEqual('date_valeur');
    expect(report.listeErreursValidation[0].nom).toEqual('Date invalide');
    expect(report.listeErreursValidation[0].positionDeLigne).toEqual(0);
    expect(report.listeErreursValidation[0].numeroDeLigne).toEqual(1);
    expect(report.listeErreursValidation[0].positionDuChamp).toEqual(-1);

    expect(report.listeErreursValidation[1].cellule).toEqual('2023-02-30');
    expect(report.listeErreursValidation[1].message).toEqual("La date '2023-02-30' n'est pas une date valide");
    expect(report.listeErreursValidation[1].nomDuChamp).toEqual('date_valeur');
    expect(report.listeErreursValidation[1].nom).toEqual('Date invalide');
    expect(report.listeErreursValidation[1].positionDeLigne).toEqual(1);
    expect(report.listeErreursValidation[1].numeroDeLigne).toEqual(2);
    expect(report.listeErreursValidation[1].positionDuChamp).toEqual(-1);

    expect(report.listeErreursValidation[2].cellule).toEqual('2023-02-29');
    expect(report.listeErreursValidation[2].message).toEqual("La date '2023-02-29' n'est pas une date valide");
    expect(report.listeErreursValidation[2].nomDuChamp).toEqual('date_valeur');
    expect(report.listeErreursValidation[2].nom).toEqual('Date invalide');
    expect(report.listeErreursValidation[2].positionDeLigne).toEqual(2);
    expect(report.listeErreursValidation[2].numeroDeLigne).toEqual(3);
    expect(report.listeErreursValidation[2].positionDuChamp).toEqual(-1);
  });

  it('quand le fichier possède des dates invalides au format DD/MM/YYYY ou MM-DD-YY, doit remonter un rapport invalide', async () => {
    // GIVEN
    const mesureIndicateurTemporaire1 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecMetricDate('31/06/2023')
      .build();
    const mesureIndicateurTemporaire2 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecMetricDate('02-30-23')
      .build();
    const mesureIndicateurTemporaire3 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecMetricDate('2023-02-29')
      .build();
    const mesureIndicateurTemporaire4 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecMetricDate('2020-02-29')
      .build();
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeMesuresIndicateurTemporaire(mesureIndicateurTemporaire1, mesureIndicateurTemporaire2, mesureIndicateurTemporaire3, mesureIndicateurTemporaire4)
      .build();
    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };

    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    // WHEN
    const report = await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(report.estValide).toEqual(false);
    expect(mesureIndicateurTemporaireRepository.sauvegarder).not.toBeCalled();

    expect(report.listeErreursValidation).toHaveLength(3);

    expect(report.listeErreursValidation[0].cellule).toEqual('2023-06-31');
    expect(report.listeErreursValidation[0].message).toEqual("La date '2023-06-31' n'est pas une date valide");
    expect(report.listeErreursValidation[0].nomDuChamp).toEqual('date_valeur');
    expect(report.listeErreursValidation[0].nom).toEqual('Date invalide');
    expect(report.listeErreursValidation[0].positionDeLigne).toEqual(0);
    expect(report.listeErreursValidation[0].numeroDeLigne).toEqual(1);
    expect(report.listeErreursValidation[0].positionDuChamp).toEqual(-1);

    expect(report.listeErreursValidation[1].cellule).toEqual('2023-02-30');
    expect(report.listeErreursValidation[1].message).toEqual("La date '2023-02-30' n'est pas une date valide");
    expect(report.listeErreursValidation[1].nomDuChamp).toEqual('date_valeur');
    expect(report.listeErreursValidation[1].nom).toEqual('Date invalide');
    expect(report.listeErreursValidation[1].positionDeLigne).toEqual(1);
    expect(report.listeErreursValidation[1].numeroDeLigne).toEqual(2);
    expect(report.listeErreursValidation[1].positionDuChamp).toEqual(-1);

    expect(report.listeErreursValidation[2].cellule).toEqual('2023-02-29');
    expect(report.listeErreursValidation[2].message).toEqual("La date '2023-02-29' n'est pas une date valide");
    expect(report.listeErreursValidation[2].nomDuChamp).toEqual('date_valeur');
    expect(report.listeErreursValidation[2].nom).toEqual('Date invalide');
    expect(report.listeErreursValidation[2].positionDeLigne).toEqual(2);
    expect(report.listeErreursValidation[2].numeroDeLigne).toEqual(3);
    expect(report.listeErreursValidation[2].positionDuChamp).toEqual(-1);
  });

  it('quand le fichier possède une date valeur au format DD/MM/YYYY, doit convertir la date au format YYYY-MM-DD', async () => {
    // GIVEN
    const mesureIndicateurTemporaire1 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D001')
      .avecMetricDate(METRIC_DATE_1)
      .avecMetricType('vi')
      .avecMetricValue('72')

      .build();
    const mesureIndicateurTemporaire2 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D007')
      .avecMetricDate('12/06/2023')
      .avecMetricType('vc')
      .avecMetricValue('14')
      .build();
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeMesuresIndicateurTemporaire(mesureIndicateurTemporaire1, mesureIndicateurTemporaire2)
      .build();
    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };

    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    const indicateurCaptor = captor<MesureIndicateurTemporaire[]>();

    // WHEN
    await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(mesureIndicateurTemporaireRepository.sauvegarder).toHaveBeenNthCalledWith(1, indicateurCaptor);

    const reportFichierData = indicateurCaptor.value;
    expect(reportFichierData).toHaveLength(2);

    expect(reportFichierData[0].id).toBeDefined();
    expect(reportFichierData[0].indicId).toEqual('IND-001');
    expect(reportFichierData[0].zoneId).toEqual('D001');
    expect(reportFichierData[0].metricDate).toEqual(METRIC_DATE_1);
    expect(reportFichierData[0].metricType).toEqual('vi');
    expect(reportFichierData[0].metricValue).toEqual('72');

    expect(reportFichierData[1].id).toBeDefined();
    expect(reportFichierData[1].indicId).toEqual('IND-001');
    expect(reportFichierData[1].zoneId).toEqual('D007');
    expect(reportFichierData[1].metricDate).toEqual('2023-06-12');
    expect(reportFichierData[1].metricType).toEqual('vc');
    expect(reportFichierData[1].metricValue).toEqual('14');
  });

  it('quand le fichier possède une date valeur au format MM-DD-YY, doit convertir la date au format YYYY-MM-DD', async () => {
    // GIVEN
    const mesureIndicateurTemporaire1 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D001')
      .avecMetricDate(METRIC_DATE_1)
      .avecMetricType('vi')
      .avecMetricValue('72')

      .build();
    const mesureIndicateurTemporaire2 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D007')
      .avecMetricDate('12-31-23')
      .avecMetricType('vc')
      .avecMetricValue('14')
      .build();
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeMesuresIndicateurTemporaire(mesureIndicateurTemporaire1, mesureIndicateurTemporaire2)
      .build();
    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };

    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    const indicateurCaptor = captor<MesureIndicateurTemporaire[]>();

    // WHEN
    await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(mesureIndicateurTemporaireRepository.sauvegarder).toHaveBeenNthCalledWith(1, indicateurCaptor);

    const reportFichierData = indicateurCaptor.value;
    expect(reportFichierData).toHaveLength(2);

    expect(reportFichierData[0].id).toBeDefined();
    expect(reportFichierData[0].indicId).toEqual('IND-001');
    expect(reportFichierData[0].zoneId).toEqual('D001');
    expect(reportFichierData[0].metricDate).toEqual(METRIC_DATE_1);
    expect(reportFichierData[0].metricType).toEqual('vi');
    expect(reportFichierData[0].metricValue).toEqual('72');

    expect(reportFichierData[1].id).toBeDefined();
    expect(reportFichierData[1].indicId).toEqual('IND-001');
    expect(reportFichierData[1].zoneId).toEqual('D007');
    expect(reportFichierData[1].metricDate).toEqual('2023-12-31');
    expect(reportFichierData[1].metricType).toEqual('vc');
    expect(reportFichierData[1].metricValue).toEqual('14');
  });

  it('quand le fichier possède un type au format VC VI VA, doit convertir en minuscule', async () => {
    // GIVEN
    const mesureIndicateurTemporaire1 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D001')
      .avecMetricDate(METRIC_DATE_1)
      .avecMetricType('VI')
      .avecMetricValue('72')
      .build();
    const mesureIndicateurTemporaire2 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D007')
      .avecMetricDate('12/06/2023')
      .avecMetricType('VC')
      .avecMetricValue('14')
      .build();
    const mesureIndicateurTemporaire3 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D007')
      .avecMetricDate('12/06/2023')
      .avecMetricType('VA')
      .avecMetricValue('14')
      .build();

    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeMesuresIndicateurTemporaire(mesureIndicateurTemporaire1, mesureIndicateurTemporaire2, mesureIndicateurTemporaire3)
      .build();

    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };

    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    const indicateurCaptor = captor<MesureIndicateurTemporaire[]>();

    // WHEN
    await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(mesureIndicateurTemporaireRepository.sauvegarder).toHaveBeenNthCalledWith(1, indicateurCaptor);

    const reportFichierData = indicateurCaptor.value;
    expect(reportFichierData).toHaveLength(3);

    expect(reportFichierData[0].id).toBeDefined();
    expect(reportFichierData[0].indicId).toEqual('IND-001');
    expect(reportFichierData[0].zoneId).toEqual('D001');
    expect(reportFichierData[0].metricDate).toEqual(METRIC_DATE_1);
    expect(reportFichierData[0].metricType).toEqual('vi');
    expect(reportFichierData[0].metricValue).toEqual('72');

    expect(reportFichierData[1].id).toBeDefined();
    expect(reportFichierData[1].indicId).toEqual('IND-001');
    expect(reportFichierData[1].zoneId).toEqual('D007');
    expect(reportFichierData[1].metricDate).toEqual('2023-06-12');
    expect(reportFichierData[1].metricType).toEqual('vc');
    expect(reportFichierData[1].metricValue).toEqual('14');

    expect(reportFichierData[2].id).toBeDefined();
    expect(reportFichierData[2].indicId).toEqual('IND-001');
    expect(reportFichierData[2].zoneId).toEqual('D007');
    expect(reportFichierData[2].metricDate).toEqual('2023-06-12');
    expect(reportFichierData[2].metricType).toEqual('va');
    expect(reportFichierData[2].metricValue).toEqual('14');
  });

  it('quand le fichier possède un zone id au format France, doit convertir en majuscule', async () => {
    // GIVEN
    const mesureIndicateurTemporaire1 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('FRANCE')
      .avecMetricDate(METRIC_DATE_1)
      .avecMetricType('VI')
      .avecMetricValue('72')
      .build();
    const mesureIndicateurTemporaire2 = new MesureIndicateurTemporaireBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('France')
      .avecMetricDate(METRIC_DATE_2)
      .avecMetricType('VC')
      .avecMetricValue('14')
      .build();

    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeMesuresIndicateurTemporaire(mesureIndicateurTemporaire1, mesureIndicateurTemporaire2)
      .build();

    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };

    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    const indicateurCaptor = captor<MesureIndicateurTemporaire[]>();

    // WHEN
    await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(mesureIndicateurTemporaireRepository.sauvegarder).toHaveBeenNthCalledWith(1, indicateurCaptor);

    const reportFichierData = indicateurCaptor.value;
    expect(reportFichierData).toHaveLength(2);

    expect(reportFichierData[0].id).toBeDefined();
    expect(reportFichierData[0].indicId).toEqual('IND-001');
    expect(reportFichierData[0].zoneId).toEqual('FRANCE');
    expect(reportFichierData[0].metricDate).toEqual(METRIC_DATE_1);
    expect(reportFichierData[0].metricType).toEqual('vi');
    expect(reportFichierData[0].metricValue).toEqual('72');

    expect(reportFichierData[1].id).toBeDefined();
    expect(reportFichierData[1].indicId).toEqual('IND-001');
    expect(reportFichierData[1].zoneId).toEqual('FRANCE');
    expect(reportFichierData[1].metricDate).toEqual(METRIC_DATE_2);
    expect(reportFichierData[1].metricType).toEqual('vc');
    expect(reportFichierData[1].metricValue).toEqual('14');
  });

  it('doit enregistrer le rapport', async () => {
    // GIVEN
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecId('d6f7e603-ace5-49f4-8ab7-78cb6d7108cf')
      .avecUtilisateurEmail('ditp.admin@example.com')
      .avecEstValide(false)
      .build();
    const payload = {
      cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
      nomDuFichier: NOM_DU_FICHIER,
      baseSchemaUrl: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };
    const rapportCaptor = captor<DetailValidationFichier>();

    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    // WHEN
    await verifierFichierIndicateurImporteUseCase.execute(payload);
    // THEN
    expect(rapportRepository.sauvegarder).toHaveBeenNthCalledWith(1, rapportCaptor);

    const nouveauRapport = rapportCaptor.value;
    expect(nouveauRapport.id).toBeDefined();
    expect(nouveauRapport.utilisateurEmail).toEqual('ditp.admin@example.com');
    expect(nouveauRapport.dateCreation).toBeDefined();
  });
});
