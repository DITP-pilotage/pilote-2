import { mock, MockProxy } from 'jest-mock-extended';
import ExportCsvDesIndicateursUseCase
  from '@/server/chantiers/usecases/ExportCsvDesIndicateursUseCase';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { IndicateurRepository } from '@/server/chantiers/domain/ports/IndicateurRepository';
import { IndicateurPourExportBuilder } from '@/server/chantiers/app/builder/IndicateurPourExportBuilder';

const optionsExport: OptionsExport = {
  perimetreIds: [],
  territorialisation: [],
  estBarometre: false,
  listeStatuts: [],
  listeChantierId: [],
  listeMeteos: [],
  listeOptionsExport: [],
  territoireCode: undefined,
  estEnAlerteTauxAvancementNonCalculé: false,
  estEnAlerteÉcart: false, 
  estEnAlerteBaisse: false,
  estEnAlerteAbscenceTauxAvancementDepartemental: false,
  estEnAlerteMétéoNonRenseignée: false,
  estEnAlertePossedePropositionsValeurAvancement: false,
};

describe('ExportCsvDesIndicateursUseCase', () => {
  let indicateurRepository: MockProxy<IndicateurRepository>;

  beforeEach(() => {
    indicateurRepository = mock<IndicateurRepository>();
  });

  it('Quand on renvoie autant de ligne que le chunk, doit renvoyer toutes les lignes', async () => {
    // Given
    const chantierIds = ['CH-001', 'CH-002', 'CH-003'];
    const territoireCodes: string[] = [];
    const indicateurChunkSize = 3;

    const indicateur1 = new IndicateurPourExportBuilder().withNom('Indicateur IND-001').build();
    const indicateur2 = new IndicateurPourExportBuilder().withNom('Indicateur IND-002').build();
    const indicateur3 = new IndicateurPourExportBuilder().withNom('Indicateur IND-003').build();

    indicateurRepository.récupérerPourExports.mockResolvedValueOnce([indicateur1]);
    indicateurRepository.récupérerPourExports.mockResolvedValueOnce([indicateur2]);
    indicateurRepository.récupérerPourExports.mockResolvedValueOnce([indicateur3]);

    const usecase = new ExportCsvDesIndicateursUseCase({ indicateurRepository });
    const profil = ProfilEnum.DITP_ADMIN;

    const jalon = 2024;

    // When
    let result: string[][] = [];
    for await (const partialResult of usecase.run({ chantierIds, territoireCodes, profil, indicateurChunkSize, optionsExport, jalon })) {
      result = [...result, ...partialResult];
    }

    // Then
    expect(result).toEqual([
      ['Indicateur IND-001'],
      ['Indicateur IND-002'],
      ['Indicateur IND-003'],
    ].map(expect.arrayContaining));
  });

  it('Quand on renvoie plus de ligne que le chunks, doit renvoyer toutes les lignes', async () => {
    // Given
    const chantierIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
    const territoireCodes: string[] = [];
    const indicateurChunkSize = 3;

    const indicateur1 = new IndicateurPourExportBuilder().withNom('Indicateur IND-001').build();
    const indicateur2 = new IndicateurPourExportBuilder().withNom('Indicateur IND-002').build();
    const indicateur3 = new IndicateurPourExportBuilder().withNom('Indicateur IND-003').build();
    const indicateur4 = new IndicateurPourExportBuilder().withNom('Indicateur IND-004').build();

    indicateurRepository.récupérerPourExports.mockResolvedValueOnce([indicateur1]);
    indicateurRepository.récupérerPourExports.mockResolvedValueOnce([indicateur2]);
    indicateurRepository.récupérerPourExports.mockResolvedValueOnce([indicateur3]);
    indicateurRepository.récupérerPourExports.mockResolvedValueOnce([indicateur4]);

    const usecase = new ExportCsvDesIndicateursUseCase({ indicateurRepository });
    const profil = ProfilEnum.DITP_ADMIN;

    const jalon = 2024;

    // When
    let result: string[][] = [];
    for await (const partialResult of usecase.run({ chantierIds, territoireCodes, profil, indicateurChunkSize, optionsExport, jalon })) {
      result = [...result, ...partialResult];
    }

    // Then
    expect(result).toEqual([
      ['Indicateur IND-001'],
      ['Indicateur IND-002'],
      ['Indicateur IND-003'],
      ['Indicateur IND-004'],
    ].map(expect.arrayContaining));
  });

  it('Quand le profil ne doit pas être visible pour les DROM, ne doit pas les remonter', async () => {
    // Given
    const indicateurChunkSize = 5;
    const chantierIds = ['CH-001'];
    const territoireCodes: string[] = [];

    const indicateur1 = new IndicateurPourExportBuilder().withNom('Indicateur IND-001').withPerimetreIds(['PER-018']).build();
    const indicateur2 = new IndicateurPourExportBuilder().withNom('Indicateur IND-002').withMaille('DEPT').build();
    const indicateur3 = new IndicateurPourExportBuilder().withNom('Indicateur IND-003').withPerimetreIds(['PER-001']).build();

    indicateurRepository.récupérerPourExports.mockResolvedValueOnce([indicateur1, indicateur2, indicateur3]);

    const usecase = new ExportCsvDesIndicateursUseCase({ indicateurRepository });
    const profil = ProfilEnum.DROM;

    const jalon = 2024;

    // When
    let result: string[][] = [];
    for await (const partialResult of usecase.run({ chantierIds, territoireCodes, profil, indicateurChunkSize, optionsExport, jalon })) {
      result = [...result, ...partialResult];
    }

    // Then
    expect(indicateurRepository.récupérerPourExports).toHaveBeenCalledWith('CH-001', territoireCodes, jalon);

    expect(result).toEqual([
      ['Indicateur IND-001'],
      ['Indicateur IND-002'],
    ].map(expect.arrayContaining));
  });
});
