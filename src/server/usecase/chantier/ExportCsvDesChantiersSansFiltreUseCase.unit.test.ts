import { mock } from 'jest-mock-extended';
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
};

describe('ExportCsvDesChantiersSansFiltreUseCase', () => {
  it('Renvoie une liste vide si pas de chantiers', async () => {
    // GIVEN
    const chantierIds: Chantier['id'][] = [];
    const chantierChunkSize = 5;
    const chantierRepository = mock<ChantierRepository>();
    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions
      .mockResolvedValueOnce(chantierIds);

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase(chantierRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = ProfilEnum.DITP_ADMIN;

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      habilitation,
      profil,
      chantierChunkSize,
      optionsExport,
    })) {
      result = [...result, ...partialResult];
    }

    // THEN
    expect(result).toEqual([]);
  });

  it('Délègue l\'habilitation aux repositories', async () => {
    // GIVEN
    const chantierChunkSize = 5;
    const chantierIds = ['CH-001'];
    const chantierRepository = mock<ChantierRepository>();
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

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      habilitation,
      profil,
      chantierChunkSize,
      optionsExport,
    })) {
      result = [...result, ...partialResult];
    }

    // THEN
    expect(chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions)
      .toHaveBeenCalledWith(habilitation, optionsExport);
    expect(chantierRepository.récupérerPourExports)
      .toHaveBeenCalledWith(chantierIds, territoireCodesLecture);
  });

  it('Renvoie 3 lignes pour 3 chantiers si configuré avec lots de 3', async () => {
    // GIVEN
    const chantierIds = ['CH-001', 'CH-002', 'CH-003'];
    const chantierChunkSize = 3;
    const chantierRepository = mock<ChantierRepository>();
    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions
      .mockResolvedValueOnce(chantierIds);
    chantierRepository.récupérerPourExports
      .mockResolvedValueOnce(chantierIds.map(_fakeChantierPourExport));

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase(chantierRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = ProfilEnum.DITP_ADMIN;

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      habilitation,
      profil,
      chantierChunkSize,
      optionsExport,
    })) {
      result = [...result, ...partialResult];
    }

    // THEN
    expect(result).toEqual([
      ['Chantier CH-001'],
      ['Chantier CH-002'],
      ['Chantier CH-003'],
    ].map(expect.arrayContaining));
  });

  it('Renvoie 4 lignes pour 4 chantiers si configuré avec lots de 3', async () => {
    // GIVEN
    const chantierIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
    const chantierChunkSize = 3;
    const firstChunk = chantierIds.slice(0, chantierChunkSize);
    const secondChunk = chantierIds.slice(chantierChunkSize);
    const chantierRepository = mock<ChantierRepository>();
    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNomAvecOptions
      .mockResolvedValueOnce(chantierIds);
    chantierRepository.récupérerPourExports
      .mockResolvedValueOnce(firstChunk.map(_fakeChantierPourExport))
      .mockResolvedValueOnce(secondChunk.map(_fakeChantierPourExport));

    const exportCsvDesChantiersSansFiltreUseCase = new ExportCsvDesChantiersUseCase(chantierRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = ProfilEnum.DITP_ADMIN;

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of exportCsvDesChantiersSansFiltreUseCase.run({
      habilitation,
      profil,
      chantierChunkSize,
      optionsExport,
    })) {
      result = [...result, ...partialResult];
    }

    // THEN
    expect(result).toEqual([
      ['Chantier CH-001'],
      ['Chantier CH-002'],
      ['Chantier CH-003'],
      ['Chantier CH-004'],
    ].map(expect.arrayContaining));
  });
});
