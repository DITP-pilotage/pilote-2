import { captor, mock, MockProxy } from 'jest-mock-extended';
import {
  ValiderFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/ValiderFichierIndicateurImporteUseCase';
import {
  FichierIndicateurValidationService,
} from '@/server/import-indicateur/domain/ports/FichierIndicateurValidationService';
import { IndicateurDataBuilder } from '@/server/import-indicateur/app/builder/IndicateurDataBuilder';
import { DetailValidationFichierBuilder } from '@/server/import-indicateur/app/builder/DetailValidationFichierBuilder';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';
import { MesureIndicateurRepository } from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository';

describe('ValiderFichierIndicateurImporteUseCase', () => {
  let fichierIndicateurValidationService: MockProxy<FichierIndicateurValidationService>;
  let validerFichierIndicateurImporteUseCase: ValiderFichierIndicateurImporteUseCase;
  let mesureIndicateurRepository: MesureIndicateurRepository;

  const CHEMIN_COMPLET_DU_FICHIER = 'cheminCompletDuFichier';
  const NOM_DU_FICHIER = 'nomDuFichier';
  const SCHEMA = 'schema';

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

    const payload = { cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER, nomDuFichier: NOM_DU_FICHIER, schema: SCHEMA };
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
      .avecMetricDate('30/12/2022')
      .avecMetricType('vi')
      .avecMetricValue('72')

      .build();
    const indicateurData2 = new IndicateurDataBuilder()
      .avecIndicId('IND-003')
      .avecZoneId('D007')
      .avecMetricDate('12/12/2022')
      .avecMetricType('vc')
      .avecMetricValue('14')
      .build();
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(true)
      .avecListeIndicateurData(indicateurData1, indicateurData2)
      .build();
    const payload = { cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER, nomDuFichier: NOM_DU_FICHIER, schema: SCHEMA };

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
    expect(reportFichierData[0].metricDate).toEqual('30/12/2022');
    expect(reportFichierData[0].metricType).toEqual('vi');
    expect(reportFichierData[0].metricValue).toEqual('72');

    expect(reportFichierData[1].id).toBeDefined();
    expect(reportFichierData[1].indicId).toEqual('IND-003');
    expect(reportFichierData[1].zoneId).toEqual('D007');
    expect(reportFichierData[1].metricDate).toEqual('12/12/2022');
    expect(reportFichierData[1].metricType).toEqual('vc');
    expect(reportFichierData[1].metricValue).toEqual('14');
  });

  it('quand le fichier est invalide, ne doit pas sauvegarder les données du fichier', async () => {
    // GIVEN
    const detailValidationFichier = new DetailValidationFichierBuilder()
      .avecEstValide(false)
      .build();
    const payload = { cheminCompletDuFichier: CHEMIN_COMPLET_DU_FICHIER, nomDuFichier: NOM_DU_FICHIER, schema: SCHEMA };

    fichierIndicateurValidationService.validerFichier.calledWith(payload).mockResolvedValue(detailValidationFichier);

    // WHEN
    await validerFichierIndicateurImporteUseCase.execute(payload);

    // THEN
    expect(mesureIndicateurRepository.sauvegarder).not.toBeCalled();
  });
});
