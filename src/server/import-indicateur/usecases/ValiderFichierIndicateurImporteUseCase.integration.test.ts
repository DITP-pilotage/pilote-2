import { captor, mock, MockProxy } from 'jest-mock-extended';
import { ValiderFichierIndicateurImporteUseCase } from '@/server/import-indicateur/usecases/ValiderFichierIndicateurImporteUseCase';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';
import { DetailValidationFichierBuilder } from '@/server/import-indicateur/app/builder/DetailValidationFichier.builder';
import { ErreurValidationFichierBuilder } from '@/server/import-indicateur/app/builder/ErreurValidationFichier.builder';
import { IndicateurDataBuilder } from '@/server/import-indicateur/app/builder/IndicateurData.builder';
import { FichierIndicateurValidationService } from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService.interface';
import { MesureIndicateurRepository } from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface';

describe('ValiderFichierIndicateurImporteUseCase', () => {
  let fichierIndicateurValidationService: MockProxy<FichierIndicateurValidationService>;
  let validerFichierIndicateurImporteUseCase: ValiderFichierIndicateurImporteUseCase;
  let mesureIndicateurRepository: MesureIndicateurRepository;

  const CHEMIN_COMPLET_DU_FICHIER = 'cheminCompletDuFichier';
  const NOM_DU_FICHIER = 'nomDuFichier';
  const SCHEMA = 'schema';
  const METRIC_DATE_1 = '30/12/2022';
  const METRIC_DATE_2 = '12/12/2022';

  beforeEach(() => {
    fichierIndicateurValidationService = mock<FichierIndicateurValidationService>();
    mesureIndicateurRepository = mock<MesureIndicateurRepository>();
    validerFichierIndicateurImporteUseCase = new ValiderFichierIndicateurImporteUseCase({
      fichierIndicateurValidationService,
      mesureIndicateurRepository,
    });
  });

  it("doit appeler le service de validation du fichier d'indicateur importé", async () => {
    // GIVEN
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .build();

    const payload = { cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER, nomDuFichier: NOM_DU_FICHIER, schema: SCHEMA, indicateurId: 'IND-001' };
    fichierIndicateurValidationService.validerFichier.calledWith(payload).mockResolvedValue(detailValidationFichier);

    // WHEN
    const result = await validerFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(result.estValide).toEqual(true);
  });

  it('quand le fichier est valide, doit sauvegarder les données du fichier contenu dans le rapport', async () => {
    // GIVEN
    const indicateurData1 = new IndicateurDataBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D001')
      .avecMetricDate(METRIC_DATE_1)
      .avecMetricType('vi')
      .avecMetricValue('72')

      .build();
    const indicateurData2 = new IndicateurDataBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D007')
      .avecMetricDate(METRIC_DATE_2)
      .avecMetricType('vc')
      .avecMetricValue('14')
      .build();
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeIndicateurData(indicateurData1, indicateurData2)
      .build();
    const payload = { cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER, nomDuFichier: NOM_DU_FICHIER, schema: SCHEMA, indicateurId: 'IND-001' };

    fichierIndicateurValidationService.validerFichier.calledWith(payload).mockResolvedValue(detailValidationFichier);

    const indicateurCaptor = captor<IndicateurData[]>();

    // WHEN
    await validerFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(mesureIndicateurRepository.sauvegarder).toHaveBeenNthCalledWith(1, indicateurCaptor);

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
      const payload = { cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER, nomDuFichier: NOM_DU_FICHIER, schema: SCHEMA, indicateurId: 'IND-001' };

      fichierIndicateurValidationService.validerFichier.calledWith(payload).mockResolvedValue(detailValidationFichier);

      // WHEN
      await validerFichierIndicateurImporteUseCase.execute(payload);

      // THEN
      expect(mesureIndicateurRepository.sauvegarder).not.toBeCalled();
    });

    it('quand au moins un indicateur est invalide, doit inclure les erreurs de validation des données du rapport', async () => {
      // GIVEN
      const indicateurData1 = new IndicateurDataBuilder()
        .avecIndicId('IND-001')
        .avecZoneId('D001')
        .avecMetricDate(METRIC_DATE_1)
        .avecMetricType('vi')
        .avecMetricValue('72')
        .build();
      const indicateurData2 = new IndicateurDataBuilder()
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
        .avecListeIndicateurData(indicateurData1, indicateurData2)
        .build();

      const payload = { cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER, nomDuFichier: NOM_DU_FICHIER, schema: SCHEMA, indicateurId: 'IND-001' };

      fichierIndicateurValidationService.validerFichier.calledWith(payload).mockResolvedValue(detailValidationFichier);

      // WHEN
      const report = await validerFichierIndicateurImporteUseCase.execute(payload);

      // THEN
      expect(report.estValide).toEqual(false);

      expect(report.listeErreursValidation).toHaveLength(2);
      expect(report.listeErreursValidation[0].nom).toEqual('METRIC_INVALIDE');
      expect(report.listeErreursValidation[1].nom).toEqual('Indicateur invalide');
    });
  });

  it('quand le fichier possède des indic_id différent de celui en paramètre, doit remonter un rapport invalide', async () => {
    // GIVEN
    const indicateurData1 = new IndicateurDataBuilder()
      .avecIndicId('IND-001')
      .avecZoneId('D001')
      .avecMetricDate(METRIC_DATE_1)
      .avecMetricType('vi')
      .avecMetricValue('72')
      .build();
    const indicateurData2 = new IndicateurDataBuilder()
      .avecIndicId('IND-003')
      .avecZoneId('D007')
      .avecMetricDate(METRIC_DATE_2)
      .avecMetricType('vc')
      .avecMetricValue('14')
      .build();
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeIndicateurData(indicateurData1, indicateurData2)
      .build();
    const payload = { cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER, nomDuFichier: NOM_DU_FICHIER, schema: SCHEMA, indicateurId: 'IND-001' };

    fichierIndicateurValidationService.validerFichier.calledWith(payload).mockResolvedValue(detailValidationFichier);

    // WHEN
    const report = await validerFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(report.estValide).toEqual(false);
    expect(mesureIndicateurRepository.sauvegarder).not.toBeCalled();

    expect(report.listeErreursValidation).toHaveLength(1);
    expect(report.listeErreursValidation[0].cellule).toEqual('IND-003');
    expect(report.listeErreursValidation[0].message).toEqual("L'indicateur IND-003 ne correpond pas à l'indicateur choisit (IND-001)");
    expect(report.listeErreursValidation[0].nomDuChamp).toEqual('indic_id');
    expect(report.listeErreursValidation[0].nom).toEqual('Indicateur invalide');
    expect(report.listeErreursValidation[0].positionDeLigne).toEqual(1);
    expect(report.listeErreursValidation[0].numeroDeLigne).toEqual(2);
    expect(report.listeErreursValidation[0].positionDuChamp).toEqual(-1);
  });
});
