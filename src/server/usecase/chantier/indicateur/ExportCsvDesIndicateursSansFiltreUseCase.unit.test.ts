import { mock } from 'jest-mock-extended';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { HabilitationBuilder } from '@/server/domain/utilisateur/habilitation/HabilitationBuilder';
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
    const indicateurChunkSize = 5;
    const chantierIds: Chantier['id'][] = [];
    const chantierRepository = mock<ChantierRepository>();
    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNom
      .mockResolvedValueOnce(chantierIds);
    const indicateurRepository = mock<IndicateurRepository>();

    const usecase = new ExportCsvDesIndicateursSansFiltreUseCase(chantierRepository, indicateurRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = 'DITP_ADMIN';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run({ habilitation, profil, indicateurChunkSize })) {
      result = [...result, ...partialResult];
    }

    // THEN
    expect(result).toEqual([]);
  });

  it('Délègue l\'habilitation aux repositories', async () => {
    // GIVEN
    const indicateurChunkSize = 5;
    const chantierIds = ['CH-001'];
    const chantierRepository = mock<ChantierRepository>();
    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNom
      .mockResolvedValueOnce(chantierIds);

    const indicateurIds = ['IND-001'];
    const indicateurRepository = mock<IndicateurRepository>();
    indicateurRepository.récupérerPourExports
      .mockResolvedValueOnce(indicateurIds.map(_fakeIndicateurPourExport));

    const usecase = new ExportCsvDesIndicateursSansFiltreUseCase(chantierRepository, indicateurRepository);
    const territoireCodesLecture = ['NAT-FR'];
    const habilitation = new HabilitationBuilder()
      .avecTerritoireCodesLecture(territoireCodesLecture)
      .build();
    const profil = 'DITP_ADMIN';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run({ habilitation, profil, indicateurChunkSize })) {
      result = [...result, ...partialResult];
    }

    // THEN
    expect(chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNom)
      .toHaveBeenCalledWith(habilitation);
    expect(indicateurRepository.récupérerPourExports)
      .toHaveBeenCalledWith(chantierIds, territoireCodesLecture);
  });

  it('Renvoie 3 lignes pour 3 chantiers si configuré avec lots de 3', async () => {
    // GIVEN
    const chantierIds = ['CH-001', 'CH-002', 'CH-003'];
    const indicateurChunkSize = 3;
    const chantierRepository = mock<ChantierRepository>();
    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNom
      .mockResolvedValueOnce(chantierIds);

    const indicateurIds = ['IND-001', 'IND-002', 'IND-003'];
    const indicateurRepository = mock<IndicateurRepository>();
    indicateurRepository.récupérerPourExports
      .mockResolvedValueOnce(indicateurIds.map(_fakeIndicateurPourExport));

    const usecase = new ExportCsvDesIndicateursSansFiltreUseCase(chantierRepository, indicateurRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = 'DITP_ADMIN';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run({ habilitation, profil, indicateurChunkSize })) {
      result = [...result, ...partialResult];
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
    const indicateurChunkSize = 3;
    const chantierRepository = mock<ChantierRepository>();
    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNom
      .mockResolvedValueOnce(chantierIds);

    const indicateurIds = ['IND-001', 'IND-002', 'IND-003', 'IND-004'];
    const firstChunk = indicateurIds.slice(0, indicateurChunkSize);
    const secondChunk = indicateurIds.slice(indicateurChunkSize);
    const indicateurRepository = mock<IndicateurRepository>();
    indicateurRepository.récupérerPourExports
      .mockResolvedValueOnce(firstChunk.map(_fakeIndicateurPourExport))
      .mockResolvedValueOnce(secondChunk.map(_fakeIndicateurPourExport));

    const usecase = new ExportCsvDesIndicateursSansFiltreUseCase(chantierRepository, indicateurRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = 'DITP_ADMIN';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run({ habilitation, profil, indicateurChunkSize })) {
      result = [...result, ...partialResult];
    }

    // THEN
    expect(result).toEqual([
      ['Indicateur IND-001'],
      ['Indicateur IND-002'],
      ['Indicateur IND-003'],
      ['Indicateur IND-004'],
    ].map(expect.arrayContaining));
  });

  it('Masque certains indicateurs pour les proflis DROMs', async () => {
    // GIVEN
    const indicateurChunkSize = 5;
    const chantierIds = ['CH-001'];
    const chantierRepository = mock<ChantierRepository>();
    chantierRepository.récupérerChantierIdsEnLectureOrdonnésParNom
      .mockResolvedValueOnce(chantierIds);

    const indicateurIds = ['IND-001', 'IND-002', 'IND-003'];
    const indicateursPourExport = indicateurIds.map(_fakeIndicateurPourExport);
    indicateursPourExport[0].périmètreIds = ['PER-018']; // contient le périmètre 18 => on garde
    indicateursPourExport[1].maille = 'DEPT'; // maille non nationale => on garde
    const indicateurÀMasquer = indicateursPourExport[2];
    indicateurÀMasquer.périmètreIds = ['PER-001']; // Il n'y a pas le périmètre 18
    indicateurÀMasquer.maille = 'NAT'; // la maille est nationale
    const indicateurRepository = mock<IndicateurRepository>();
    indicateurRepository.récupérerPourExports
      .mockResolvedValueOnce(indicateursPourExport);

    const usecase = new ExportCsvDesIndicateursSansFiltreUseCase(chantierRepository, indicateurRepository);
    const habilitation = new HabilitationBuilder().build();
    const profil = 'DROM';

    // WHEN
    let result: string[][] = [];
    for await (const partialResult of usecase.run({ habilitation, profil, indicateurChunkSize })) {
      result = [...result, ...partialResult];
    }

    // THEN
    expect(result).toEqual([
      ['Indicateur IND-001'],
      ['Indicateur IND-002'],
    ].map(expect.arrayContaining));
  });
});
