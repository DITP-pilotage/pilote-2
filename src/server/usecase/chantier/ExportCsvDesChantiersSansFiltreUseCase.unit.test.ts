import { mock, MockProxy } from 'jest-mock-extended';
import { ExportCsvDesChantiersUseCase } from '@/server/usecase/chantier/ExportCsvDesChantiersUseCase';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { HabilitationBuilder } from '@/server/domain/utilisateur/habilitation/HabilitationBuilder';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import {
  ChantierPourExport,
  ChantierPourExportBuilder,
} from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase.interface';
import { OptionsExport } from '@/server/usecase/chantier/OptionsExport';
import { ProfilEnum } from '@/server/app/enum/profil.enum';

function _fakeChantierPourExport(cid: Chantier['id']): ChantierPourExport {
  return (new ChantierPourExportBuilder)
    .avecNom('Chantier ' + cid)
    .build();
}

const optionsExport: OptionsExport = {
  perimetreIds: [],
  estTerritorialise: false,
  estBarometre: false,
  listeStatuts: [],
  listeChantierId: [],
  listeMeteos: [],
};

describe('ExportCsvDesChantiersSansFiltreUseCase', () => {
  let chantierRepository: MockProxy<ChantierRepository>;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
  });

  it('Renvoie une liste vide si pas de chantiers', async () => {
    // Given
    const chantierIds: Chantier['id'][] = [];
    const chantierChunkSize = 5;
    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions
      .mockResolvedValueOnce(chantierIds);

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase(chantierRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = ProfilEnum.DITP_ADMIN;

    const jalon = 2024;

    // When
    let result: string[][] = [];
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      habilitation,
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

  it('Délègue l\'habilitation aux repositories', async () => {
    // Given
    const chantierChunkSize = 5;
    const chantierIds = ['CH-001'];
    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions
      .mockResolvedValueOnce(chantierIds);
    chantierRepository.récupérerPourExports
      .mockResolvedValueOnce(chantierIds.map(_fakeChantierPourExport));

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase(chantierRepository);
    const territoireCodesLecture = ['NAT-FR'];
    const habilitation = new HabilitationBuilder()
      .avecTerritoireCodesLecture(territoireCodesLecture)
      .build();
    const profil = ProfilEnum.DITP_ADMIN;

    const jalon = 2024;

    // When
    let result: string[][] = [];
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      habilitation,
      profil,
      chantierChunkSize,
      optionsExport,
      jalon,
    })) {
      result = [...result, ...partialResult];
    }

    // Then
    expect(chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions)
      .toHaveBeenCalledWith(habilitation, optionsExport);
    expect(chantierRepository.récupérerPourExports)
      .toHaveBeenCalledWith(chantierIds, territoireCodesLecture, optionsExport, jalon);
  });

  it('Renvoie 3 lignes pour 3 chantiers si configuré avec lots de 3', async () => {
    // Given
    const chantierIds = ['CH-001', 'CH-002', 'CH-003'];
    const chantierChunkSize = 3;

    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions
      .mockResolvedValueOnce(chantierIds);
    chantierRepository.récupérerPourExports
      .mockResolvedValueOnce(chantierIds.map(_fakeChantierPourExport));

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase(chantierRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = ProfilEnum.DITP_ADMIN;

    const jalon = 2024;

    // When
    let result: string[][] = [];
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      habilitation,
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
    const chantierChunkSize = 3;
    const firstChunk = chantierIds.slice(0, chantierChunkSize);
    const secondChunk = chantierIds.slice(chantierChunkSize);

    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions
      .mockResolvedValueOnce(chantierIds);
    chantierRepository.récupérerPourExports
      .mockResolvedValueOnce(firstChunk.map(_fakeChantierPourExport))
      .mockResolvedValueOnce(secondChunk.map(_fakeChantierPourExport));

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase(chantierRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = ProfilEnum.DITP_ADMIN;

    const jalon = 2024;

    // When
    let result: string[][] = [];
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      habilitation,
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
