import { mock, MockProxy } from 'jest-mock-extended';
import { ExportCsvDesChantiersUseCase } from '@/server/chantiers/usecases/ExportCsvDesChantiersUseCase';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import { ChantierRepository } from '@/server/chantiers/domain/ports/ChantierRepository';
import { ChantierPourExportBuilder } from '@/server/chantiers/app/builder/ChantierPourExportBuilder';

const optionsExport: OptionsExport = {
  perimetreIds: [],
  estTerritorialise: false,
  estBarometre: false,
  listeStatuts: [],
  listeChantierId: [],
  listeMeteos: [],
  listeOptionsExport: [],
};

describe('ExportCsvDesChantiersUseCase', () => {
  let chantierRepository: MockProxy<ChantierRepository>;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
  });

  it('Renvoie une liste vide si pas de chantiers', async () => {
    // Given
    const chantierIds: string[] = [];
    const territoireCodes: string[] = [];
    const chantierChunkSize = 5;

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase({ chantierRepository });
    const profil = ProfilEnum.DITP_ADMIN;

    const jalon = 2024;

    // When
    let result: string[][] = [];
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      chantierIds,
      territoireCodes,
      profil,
      chantierChunkSize,
      optionsExport,
      jalon,
    })) {
      result = [...result, ...partialResult];
    }

    // Then
    expect(result).toEqual([]);
  });

  it("Délègue l'habilitation aux repositories", async () => {
    // Given
    const chantierChunkSize = 5;
    const chantierId = 'CH-001';
    const chantier = new ChantierPourExportBuilder().build();

    const territoireCodes = ['NAT-FR'];

    chantierRepository.récupérerPourExports.mockResolvedValueOnce([chantier]);

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase({ chantierRepository });
    const profil = ProfilEnum.DITP_ADMIN;

    const jalon = 2024;

    // When
    let result: string[][] = [];
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      chantierIds: [chantierId],
      territoireCodes,
      profil,
      chantierChunkSize,
      optionsExport,
      jalon,
    })) {
      result = [...result, ...partialResult];
    }

    // Then
    expect(chantierRepository.récupérerPourExports).toHaveBeenCalledWith(chantierId, territoireCodes, optionsExport, jalon);
  });

  it('Renvoie 3 lignes pour 3 chantiers si configuré avec lots de 3', async () => {
    // Given
    const chantierIds = ['CH-001', 'CH-002', 'CH-003'];
    const chantierChunkSize = 3;

    const chantier1 = new ChantierPourExportBuilder().avecId('CH-001').avecNom('Chantier CH-001').build();
    const chantier2 = new ChantierPourExportBuilder().avecId('CH-002').avecNom('Chantier CH-002').build();
    const chantier3 = new ChantierPourExportBuilder().avecId('CH-003').avecNom('Chantier CH-003').build();

    chantierRepository.récupérerPourExports.mockResolvedValueOnce([chantier1]);
    chantierRepository.récupérerPourExports.mockResolvedValueOnce([chantier2]);
    chantierRepository.récupérerPourExports.mockResolvedValueOnce([chantier3]);

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase({ chantierRepository });
    const profil = ProfilEnum.DITP_ADMIN;

    const jalon = 2024;

    // When
    let result: string[][] = [];

    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      chantierIds,
      territoireCodes: [],
      profil,
      chantierChunkSize,
      optionsExport,
      jalon,
    })) {
      result = [...result, ...partialResult];
    }

    // Then
    expect(result).toEqual([
      ['Chantier CH-001'],
      ['Chantier CH-002'],
      ['Chantier CH-003'],
    ].map(expect.arrayContaining));
  });

  it('Renvoie 4 lignes pour 4 chantiers si configuré avec lots de 3', async () => {
    // Given
    const chantierIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
    const territoireCodes: string[] = [];
    const chantierChunkSize = 3;

    const chantier1 = new ChantierPourExportBuilder().avecId('CH-001').avecNom('Chantier CH-001').build();
    const chantier2 = new ChantierPourExportBuilder().avecId('CH-002').avecNom('Chantier CH-002').build();
    const chantier3 = new ChantierPourExportBuilder().avecId('CH-003').avecNom('Chantier CH-003').build();
    const chantier4 = new ChantierPourExportBuilder().avecId('CH-004').avecNom('Chantier CH-004').build();

    chantierRepository.récupérerPourExports.mockResolvedValueOnce([chantier1]);
    chantierRepository.récupérerPourExports.mockResolvedValueOnce([chantier2]);
    chantierRepository.récupérerPourExports.mockResolvedValueOnce([chantier3]);
    chantierRepository.récupérerPourExports.mockResolvedValueOnce([chantier4]);

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase({ chantierRepository });
    const profil = ProfilEnum.DITP_ADMIN;

    const jalon = 2024;

    let result: string[][] = [];

    // When
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      chantierIds,
      territoireCodes,
      profil,
      chantierChunkSize,
      optionsExport,
      jalon,
    })) {
      result = [...result, ...partialResult];
    }

    // Then
    expect(result).toEqual([
      ['Chantier CH-001'],
      ['Chantier CH-002'],
      ['Chantier CH-003'],
      ['Chantier CH-004'],
    ].map(expect.arrayContaining));
  });
});
