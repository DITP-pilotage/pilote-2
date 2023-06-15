/* eslint-disable unicorn/prefer-spread */
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { HabilitationBuilder } from '@/server/domain/utilisateur/habilitation/HabilitationBuilder';
import { testDouble } from '@/server/utils/testUtils';
import { Configuration } from '@/server/infrastructure/Configuration';
import Chantier from '@/server/domain/chantier/Chantier.interface';
import ExportCsvDesIndicateursSansFiltreUseCase
  from '@/server/usecase/chantier/indicateur/ExportCsvDesIndicateursSansFiltreUseCase';
import IndicateurRepository from '@/server/domain/indicateur/IndicateurRepository.interface';
import Indicateur from '@/server/domain/indicateur/Indicateur.interface';
import {
  IndicateurPourExport,
} from '@/server/usecase/chantier/indicateur/ExportCsvDesIndicateursSansFiltreUseCase.interface';

function _fakeIndicateurPourExport(cid: Indicateur['id']): IndicateurPourExport {
  return {
    nom: 'Indicateur ' + cid,
    périmètreIds: ['PER-001'],
    maille: 'NAT',
  } as unknown as IndicateurPourExport;
}

describe('ExportCsvDesIndicateursSansFiltreUseCase', () => {
  it('Renvoie une liste vide si pas de chantiers', async () => {
    // GIVEN
    const chantierIds: Chantier['id'][] = [];
    const chantierRepository = testDouble<ChantierRepository>({
      récupérerChantierIdsEnLectureOrdonnésParNom: jest.fn()
        .mockReturnValueOnce(Promise.resolve(chantierIds)),
    });
    const indicateurRepository = testDouble<IndicateurRepository>();

    const usecase = new ExportCsvDesIndicateursSansFiltreUseCase(chantierRepository, indicateurRepository);
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
    const chantierRepository = testDouble<ChantierRepository>({
      récupérerChantierIdsEnLectureOrdonnésParNom,
    });
    const indicateurIds = ['IND-001'];
    const récupérerPourExports = jest.fn()
      .mockReturnValueOnce(Promise.resolve(indicateurIds.map(_fakeIndicateurPourExport)));
    const indicateurRepository = testDouble<IndicateurRepository>({
      récupérerPourExports,
    });

    const usecase = new ExportCsvDesIndicateursSansFiltreUseCase(chantierRepository, indicateurRepository);
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
    });
    const indicateurIds = ['IND-001', 'IND-002', 'IND-003'];
    const indicateurRepository = testDouble<IndicateurRepository>({
      récupérerPourExports: jest.fn()
        .mockReturnValueOnce(Promise.resolve(indicateurIds.map(_fakeIndicateurPourExport))),
    });

    const config = testDouble<Configuration>({ exportCsvIndicateursChunkSize: chunkSize });
    const usecase = new ExportCsvDesIndicateursSansFiltreUseCase(chantierRepository, indicateurRepository, config);
    const habilitation = new HabilitationBuilder().build();
    const profil = 'DITP_ADMIN';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run(habilitation, profil)) {
      result = result.concat(partialResult);
    }

    // THEN
    expect(result).toEqual([
      ['Indicateur IND-001'],
      ['Indicateur IND-002'],
      ['Indicateur IND-003'],
    ].map(expect.arrayContaining));
  });

  it('Renvoie 4 lignes pour 4 chantiers si configuré avec lots de 3', async () => {
    // GIVEN
    const chantierIds = ['CH-001', 'CH-002', 'CH-003', 'CH-004'];
    const chunkSize = 3;
    const chantierRepository = testDouble<ChantierRepository>({
      récupérerChantierIdsEnLectureOrdonnésParNom: jest.fn()
        .mockReturnValueOnce(Promise.resolve(chantierIds)),
    });
    const indicateurIds = ['IND-001', 'IND-002', 'IND-003', 'IND-004'];
    const firstChunk = indicateurIds.slice(0, chunkSize);
    const secondChunk = indicateurIds.slice(chunkSize);
    const indicateurRepository = testDouble<IndicateurRepository>({
      récupérerPourExports: jest.fn()
        .mockReturnValueOnce(Promise.resolve(firstChunk.map(_fakeIndicateurPourExport)))
        .mockReturnValueOnce(Promise.resolve(secondChunk.map(_fakeIndicateurPourExport))),
    });

    const config = testDouble<Configuration>({ exportCsvIndicateursChunkSize: chunkSize });
    const usecase = new ExportCsvDesIndicateursSansFiltreUseCase(chantierRepository, indicateurRepository, config);
    const habilitation = new HabilitationBuilder().build();
    const profil = 'DITP_ADMIN';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run(habilitation, profil)) {
      result = result.concat(partialResult);
    }

    // THEN
    expect(result).toEqual([
      ['Indicateur IND-001'],
      ['Indicateur IND-002'],
      ['Indicateur IND-003'],
      ['Indicateur IND-004'],
    ].map(expect.arrayContaining));
  });
});
