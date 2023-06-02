import { captor, mock, MockProxy } from 'jest-mock-extended';
import {
  PublierFichierIndicateurImporteUseCase,
} from '@/server/import-indicateur/usecases/PublierFichierIndicateurImporteUseCase';
import {
  MesureIndicateurTemporaireRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurTemporaireRepository.interface';
import { RapportRepository } from '@/server/import-indicateur/domain/ports/RapportRepository';
import { MesureIndicateurTemporaire } from '@/server/import-indicateur/domain/MesureIndicateurTemporaire';
import {
  MesureIndicateurTemporaireBuilder,
} from '@/server/import-indicateur/app/builder/MesureIndicateurTemporaire.builder';
import {
  MesureIndicateurRepository,
} from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository.interface';

describe('PublierFichierIndicateurImporteUseCase', () => {
  let publierFichierIndicateurImporteUseCase: PublierFichierIndicateurImporteUseCase;
  let mesureIndicateurTemporaireRepository: MockProxy<MesureIndicateurTemporaireRepository>;
  let mesureIndicateurRepository: MesureIndicateurRepository;
  let rapportRepository: RapportRepository;

  beforeEach(() => {
    mesureIndicateurRepository = mock<MesureIndicateurRepository>();
    mesureIndicateurTemporaireRepository = mock<MesureIndicateurTemporaireRepository>();
    rapportRepository = mock<RapportRepository>();
    publierFichierIndicateurImporteUseCase = new PublierFichierIndicateurImporteUseCase({
      mesureIndicateurTemporaireRepository,
      mesureIndicateurRepository,
      rapportRepository,
    });
  });

  it('doit transférer les mesures temporaires des indicateurs vers le repository permanent', async () => {
    // GIVEN
    const mesureIndicateurTemporaireCaptor = captor<MesureIndicateurTemporaire[]>();
    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId('IND-001')
        .avecMetricDate('30/12/2022')
        .avecMetricType('vi')
        .avecMetricValue('12')
        .avecRapportId('20a717e6-2de9-428c-b4e7-80f7b9f36ffc')
        .avecZoneId('D001')
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId('IND-002')
        .avecMetricDate('31/12/2022')
        .avecMetricType('vc')
        .avecMetricValue('15')
        .avecRapportId('20a717e6-2de9-428c-b4e7-80f7b9f36ffc')
        .avecZoneId('D002')
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(listeMesuresIndicateursTemporaires);


    // WHEN
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: '20a717e6-2de9-428c-b4e7-80f7b9f36ffc',
    });

    // THEN
    expect(mesureIndicateurTemporaireRepository.recupererToutParRapportId).toHaveBeenNthCalledWith(1, '20a717e6-2de9-428c-b4e7-80f7b9f36ffc');
    expect(mesureIndicateurRepository.sauvegarder).toHaveBeenNthCalledWith(1, mesureIndicateurTemporaireCaptor);
    expect(mesureIndicateurTemporaireRepository.supprimerToutParRapportId).toHaveBeenNthCalledWith(1, '20a717e6-2de9-428c-b4e7-80f7b9f36ffc');

    const listeMesuresIndicateurs = mesureIndicateurTemporaireCaptor.value;

    expect(listeMesuresIndicateurs).toHaveLength(2);

    expect(listeMesuresIndicateurs[0].id).toBeDefined();
    expect(listeMesuresIndicateurs[0].rapportId).toEqual('20a717e6-2de9-428c-b4e7-80f7b9f36ffc');
    expect(listeMesuresIndicateurs[0].indicId).toEqual('IND-001');
    expect(listeMesuresIndicateurs[0].metricDate).toEqual('30/12/2022');
    expect(listeMesuresIndicateurs[0].metricType).toEqual('vi');
    expect(listeMesuresIndicateurs[0].metricValue).toEqual('12');
    expect(listeMesuresIndicateurs[0].zoneId).toEqual('D001');

    expect(listeMesuresIndicateurs[1].id).toBeDefined();
    expect(listeMesuresIndicateurs[1].rapportId).toEqual('20a717e6-2de9-428c-b4e7-80f7b9f36ffc');
    expect(listeMesuresIndicateurs[1].indicId).toEqual('IND-002');
    expect(listeMesuresIndicateurs[1].metricDate).toEqual('31/12/2022');
    expect(listeMesuresIndicateurs[1].metricType).toEqual('vc');
    expect(listeMesuresIndicateurs[1].metricValue).toEqual('15');
    expect(listeMesuresIndicateurs[1].zoneId).toEqual('D002');
  });
});
