import ObjectifProjetStructurantRepository from '@/server/domain/projetStructurant/objectif/ObjectifRepository.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import CréerUnObjectifProjetStructurantUseCase from './CréerUnObjectifProjetStructurantUseCase';

const RANDOM_UUID = '123';

jest.mock('node:crypto', () => ({
  randomUUID: () => RANDOM_UUID,
}));

describe('CréerUnObjectifUseCase', () => {
  test('créé un objectif', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const projetStructurantId = '444';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'SuiviDesObjectifs';
    const territoireCode = 'DEPT-34';

    jest.useFakeTimers().setSystemTime(date);
    const stubObjectifRepository = { créer: jest.fn() } as unknown as ObjectifProjetStructurantRepository;
    const créerUnObjectif = new CréerUnObjectifProjetStructurantUseCase(stubObjectifRepository);

    const habilitation = { 'saisie.commentaire': {
      chantiers: [],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];

    //WHEN
    await créerUnObjectif.run(projetStructurantId, territoireCode, contenu, auteur, type, habilitation);

    //THEN
    expect(stubObjectifRepository.créer).toHaveBeenNthCalledWith(1, projetStructurantId, RANDOM_UUID, contenu, auteur, type, date);
  });

  test('retourne l\'objectif créé', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const projetStructurantId = '444';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'SuiviDesObjectifs';
    const territoireCode = 'DEPT-34';

    jest.useFakeTimers().setSystemTime(date);
    const stubObjectifRepository = { créer: jest.fn().mockReturnValue({
      contenu,
      auteur,
      date,
    }) } as unknown as ObjectifProjetStructurantRepository;
    const créerUnObjectif = new CréerUnObjectifProjetStructurantUseCase(stubObjectifRepository);

    const habilitation = { 'saisie.commentaire': {
      chantiers: [],
      territoires: [territoireCode],
    } } as unknown as Utilisateur['habilitations'];

    //WHEN
    const objectifCréé = await créerUnObjectif.run(projetStructurantId, territoireCode, contenu, auteur, type, habilitation);

    //THEN
    expect(objectifCréé).toStrictEqual({
      contenu,
      auteur,
      date,
    });
  });
});
