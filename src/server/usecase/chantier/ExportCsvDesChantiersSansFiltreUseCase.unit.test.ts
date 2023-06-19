/* eslint-disable unicorn/prefer-spread */
import {
  ExportCsvDesChantiersSansFiltreUseCase,
} from '@/server/usecase/chantier/ExportCsvDesChantiersSansFiltreUseCase';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { HabilitationBuilder } from '@/server/domain/utilisateur/habilitation/HabilitationBuilder';
import { testDouble } from '@/server/utils/testUtils';
import { Configuration } from '@/server/infrastructure/Configuration';
import Chantier from '@/server/domain/chantier/Chantier.interface';

function _fakeChantierPourExport(cid: Chantier['id']) {
  return { nom: 'Chantier ' + cid };
}

describe('ExportCsvDesChantiersSansFiltreUseCase', () => {
  it('Renvoie une liste vide si pas de chantiers', async () => {
    // GIVEN
    const chantierIds: Chantier['id'][] = [];
    const chantierRepository = testDouble<ChantierRepository>({
      récupérerChantierIdsEnLectureOrdonnésParNom: jest.fn()
        .mockReturnValueOnce(Promise.resolve(chantierIds)),
    });

    const usecase = new ExportCsvDesChantiersSansFiltreUseCase(chantierRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = 'DITP_ADMIN';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run(habilitation, profil)) {
      result = result.concat(partialResult);
    }

    // THEN
    expect(result).toEqual([]);
  });

  it('Délègue l\'habilitation aux repositories', async () => {
    // GIVEN
    const chantierIds = ['CH-001'];
    const récupérerChantierIdsEnLectureOrdonnésParNom = jest.fn()
      .mockReturnValueOnce(Promise.resolve(chantierIds));
    const récupérerPourExports = jest.fn()
      .mockReturnValueOnce(Promise.resolve(chantierIds.map(_fakeChantierPourExport)));
    const chantierRepository = testDouble<ChantierRepository>({
      récupérerChantierIdsEnLectureOrdonnésParNom,
      récupérerPourExports,
    });

    const usecase = new ExportCsvDesChantiersSansFiltreUseCase(chantierRepository);
    const territoireCodesLecture = ['NAT-FR'];
    const habilitation = new HabilitationBuilder()
      .avecTerritoireCodesLecture(territoireCodesLecture)
      .build();
    const profil = 'DITP_ADMIN';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run(habilitation, profil)) {
      result = result.concat(partialResult);
    }

    // THEN
    expect(récupérerChantierIdsEnLectureOrdonnésParNom.mock.calls[0][0])
      .toStrictEqual(habilitation);
    expect(récupérerPourExports.mock.calls[0][1])
      .toStrictEqual(territoireCodesLecture);
  });

  it('Renvoie 3 lignes pour 3 chantiers si configuré avec lots de 3', async () => {
    // GIVEN
    const chantierIds = ['CH-001', 'CH-002', 'CH-003'];
    const chunkSize = 3;
    const chantierRepository = testDouble<ChantierRepository>({
      récupérerChantierIdsEnLectureOrdonnésParNom: jest.fn()
        .mockReturnValueOnce(Promise.resolve(chantierIds)),
      récupérerPourExports: jest.fn()
        .mockReturnValueOnce(Promise.resolve(chantierIds.map(_fakeChantierPourExport))),
    });

    const config = testDouble<Configuration>({ exportCsvChantiersChunkSize: chunkSize });
    const usecase = new ExportCsvDesChantiersSansFiltreUseCase(chantierRepository, config);
    const habilitation = new HabilitationBuilder().build();
    const profil = 'DITP_ADMIN';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run(habilitation, profil)) {
      result = result.concat(partialResult);
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
    const chunkSize = 3;
    const firstChunk = chantierIds.slice(0, chunkSize);
    const secondChunk = chantierIds.slice(chunkSize);
    const chantierRepository = testDouble<ChantierRepository>({
      récupérerChantierIdsEnLectureOrdonnésParNom: jest.fn()
        .mockReturnValueOnce(Promise.resolve(chantierIds)),
      récupérerPourExports: jest.fn()
        .mockReturnValueOnce(Promise.resolve(firstChunk.map(_fakeChantierPourExport)))
        .mockReturnValueOnce(Promise.resolve(secondChunk.map(_fakeChantierPourExport))),
    });

    const config = testDouble<Configuration>({ exportCsvChantiersChunkSize: chunkSize });
    const usecase = new ExportCsvDesChantiersSansFiltreUseCase(chantierRepository, config);
    const habilitation = new HabilitationBuilder().build();
    const profil = 'DITP_ADMIN';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run(habilitation, profil)) {
      result = result.concat(partialResult);
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
