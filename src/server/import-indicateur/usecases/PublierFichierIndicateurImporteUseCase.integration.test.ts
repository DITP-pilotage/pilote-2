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
import { PropositionValeurActuelleRepository } from '@/server/import-indicateur/domain/ports/PropositionValeurActuelleRepository';

describe('PublierFichierIndicateurImporteUseCase', () => {
  let publierFichierIndicateurImporteUseCase: PublierFichierIndicateurImporteUseCase;
  let mesureIndicateurTemporaireRepository: MockProxy<MesureIndicateurTemporaireRepository>;
  let mesureIndicateurRepository: MesureIndicateurRepository;
  let rapportRepository: RapportRepository;
  let propositionValeurActuelleRepository: PropositionValeurActuelleRepository;

  beforeEach(() => {
    mesureIndicateurRepository = mock<MesureIndicateurRepository>();
    mesureIndicateurTemporaireRepository = mock<MesureIndicateurTemporaireRepository>();
    rapportRepository = mock<RapportRepository>();
    propositionValeurActuelleRepository = mock<PropositionValeurActuelleRepository>();
    publierFichierIndicateurImporteUseCase = new PublierFichierIndicateurImporteUseCase({
      mesureIndicateurTemporaireRepository,
      mesureIndicateurRepository,
      rapportRepository,
      propositionValeurActuelleRepository,
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
  it('doit supprimer les propositions de valeurs associés aux va importés', async () => {
    // GIVEN
    const propositionsAModifierCaptor1 = captor<{ dateValeurImportee: Date, indicId: string, zoneId: string, valeurImportee: number }>();
    const propositionsAModifierCaptor2 = captor<{ dateValeurImportee: Date, indicId: string, zoneId: string, valeurImportee: number }>();

    const listeMesuresIndicateursTemporaires = [
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId('IND-001')
        .avecMetricDate('2022-12-01')
        .avecMetricType('va')
        .avecMetricValue('12')
        .avecRapportId('20a717e6-2de9-428c-b4e7-80f7b9f36ffc')
        .avecZoneId('D01')
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId('IND-002')
        .avecMetricDate('2024-12-01')
        .avecMetricType('va')
        .avecMetricValue('11.3')
        .avecRapportId('20a717e6-2de9-428c-b4e7-80f7b9f36ffc')
        .avecZoneId('D01')
        .build(),
      new MesureIndicateurTemporaireBuilder()
        .avecIndicId('IND-002')
        .avecMetricDate('31/12/2022')
        .avecMetricType('vc')
        .avecMetricValue('15')
        .avecRapportId('20a717e6-2de9-428c-b4e7-80f7b9f36ffc')
        .avecZoneId('D02')
        .build(),
    ];

    mesureIndicateurTemporaireRepository.recupererToutParRapportId.mockResolvedValue(listeMesuresIndicateursTemporaires);
    // WHEN
    await publierFichierIndicateurImporteUseCase.execute({
      rapportId: '20a717e6-2de9-428c-b4e7-80f7b9f36ffc',
    });

    // THEN
    expect(mesureIndicateurTemporaireRepository.recupererToutParRapportId).toHaveBeenNthCalledWith(1, '20a717e6-2de9-428c-b4e7-80f7b9f36ffc');
    expect(propositionValeurActuelleRepository.modifierStatutPropositionsValeurActuelleApresImport).toHaveBeenCalledTimes(2);
    expect(propositionValeurActuelleRepository.modifierStatutPropositionsValeurActuelleApresImport).toHaveBeenNthCalledWith(1, propositionsAModifierCaptor1);
    expect(propositionValeurActuelleRepository.modifierStatutPropositionsValeurActuelleApresImport).toHaveBeenNthCalledWith(2, propositionsAModifierCaptor2);
    expect(mesureIndicateurTemporaireRepository.supprimerToutParRapportId).toHaveBeenNthCalledWith(1, '20a717e6-2de9-428c-b4e7-80f7b9f36ffc');

    const propositionsAModifier1 = propositionsAModifierCaptor1.value;
    const propositionsAModifier2 = propositionsAModifierCaptor2.value;

    expect(propositionsAModifier1.indicId).toEqual('IND-001');
    expect(propositionsAModifier1.zoneId).toEqual('D01');
    expect(propositionsAModifier1.dateValeurImportee).toEqual(new Date('2022-12-01'));
    expect(propositionsAModifier1.valeurImportee).toEqual(12);

    expect(propositionsAModifier2.indicId).toEqual('IND-002');
    expect(propositionsAModifier2.zoneId).toEqual('D01');
    expect(propositionsAModifier2.dateValeurImportee).toEqual(new Date('2024-12-01'));
    expect(propositionsAModifier2.valeurImportee).toEqual(11.3);

  });
});
