import { captor, mock, MockProxy } from 'jest-mock-extended';
import {
  VerifierFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/VerifierFichierIndicateurImporteUseCase';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';
import { DetailValidationFichierBuilder } from '@/server/import-indicateur/app/builder/DetailValidationFichier.builder';
import { ErreurValidationFichierBuilder } from '@/server/import-indicateur/app/builder/ErreurValidationFichier.builder';
import { MesureIndicateurTemporaireBuilder } from '@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder';
import {
  FichierIndicateurValidationService,
} from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface';
import { DetailValidationFichier } from '@/server/import-indicateur/domain/DetailValidationFichier';
import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import {
  MesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface';

describe('VerifierFichierIndicateurImporteUseCase', () => {
  let fichierIndicateurValidationService: MockProxy<FichierIndicateurValidationService>;
  let verifierFichierIndicateurImporteUseCase: VerifierFichierIndicateurImporteUseCase;
  let mesureIndicateurTemporaireRepository: MesureIndicateurTemporaireRepository;
  let rapportRepository: RapportRepository;

  const CHEMIN_COMPLET_DU_FICHIER = 'cheminCompletDuFichier';
  const NOM_DU_FICHIER = 'nomDuFichier';
  const SCHEMA = 'schema';
  const METRIC_DATE_1 = '30/12/2022';
  const METRIC_DATE_2 = '12/12/2022';

  beforeEach(() => {
    fichierIndicateurValidationService = mock<FichierIndicateurValidationService>();
    mesureIndicateurTemporaireRepository = mock<MesureIndicateurTemporaireRepository>();
    rapportRepository = mock<RapportRepository>();
    verifierFichierIndicateurImporteUseCase = new VerifierFichierIndicateurImporteUseCase({
      fichierIndicateurValidationService,
      mesureIndicateurTemporaireRepository,
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
      schema: SCHEMA,
      indicateurId: 'IND-001',
      utilisateurAuteurDeLimportEmail: 'ditp.admin@example.com',
    };
    fichierIndicateurValidationService.validerFichier.mockResolvedValue(detailValidationFichier);

    // WHEN
    const result = await verifierFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(result.estValide).toEqual(true);
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
      schema: SCHEMA,
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

  describe('quand le fichier est invalide', () => {
    it('ne doit pas sauvegarder les données du fichier', async () => {
      // GIVEN
      const detailValidationFichier = new DetailValidationFichierBuilder()
        .avecEstValide(false)
        .build();
      const payload = {
        cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER,
        nomDuFichier: NOM_DU_FICHIER,
        schema: SCHEMA,
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
        schema: SCHEMA,
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
        schema: SCHEMA,
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
      schema: SCHEMA,
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
    expect(report.listeErreursValidation[0].message).toEqual("L'indicateur IND-003 ne correpond pas à l'indicateur choisit (IND-001)");
    expect(report.listeErreursValidation[0].nomDuChamp).toEqual('indic_id');
    expect(report.listeErreursValidation[0].nom).toEqual('Indicateur invalide');
    expect(report.listeErreursValidation[0].positionDeLigne).toEqual(1);
    expect(report.listeErreursValidation[0].numeroDeLigne).toEqual(2);
    expect(report.listeErreursValidation[0].positionDuChamp).toEqual(-1);
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
      schema: SCHEMA,
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
