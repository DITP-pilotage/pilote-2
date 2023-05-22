import ObjectifRepository
  from '@/server/domain/objectif/ObjectifRepository.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';
import CréerUnObjectifUseCase from './CréerUnObjectifUseCase';

const RANDOM_UUID = '123';

jest.mock('node:crypto', () => ({
  randomUUID: () => RANDOM_UUID,
}));

describe('CréerUnObjectifUseCase', () => {
  test('créé un objectif', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'notreAmbition';

    jest.useFakeTimers().setSystemTime(date);
    const stubObjectifRepository = { créer: jest.fn() } as unknown as ObjectifRepository;
    const créerUnObjectif = new CréerUnObjectifUseCase(stubObjectifRepository);

    const habilitation = { 'saisie.commentaire': {
      chantiers: [chantierId],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    //WHEN
    await créerUnObjectif.run(chantierId, contenu, auteur, type, habilitation);

    //THEN
    expect(stubObjectifRepository.créer).toHaveBeenNthCalledWith(1, chantierId, RANDOM_UUID, contenu, auteur, type, date);
  });

  test('retourne l\'objectif créé', async () => {
    //GIVEN
    const contenu = 'test contenu';
    const chantierId = 'CH-011';
    const auteur = 'Jean DDDD';
    const date = new Date('2023-03-22T00:00:00.000Z');
    const type = 'notreAmbition';

    jest.useFakeTimers().setSystemTime(date);
    const stubObjectifRepository = { créer: jest.fn().mockReturnValue({
      contenu,
      auteur,
      date,
    }) } as unknown as ObjectifRepository;
    const créerUnObjectif = new CréerUnObjectifUseCase(stubObjectifRepository);

    const habilitation = { 'saisie.commentaire': {
      chantiers: [chantierId],
      territoires: ['NAT-FR'],
    } } as unknown as Utilisateur['habilitations'];

    //WHEN
    const objectifCréé = await créerUnObjectif.run(chantierId, contenu, auteur, type, habilitation);

    //THEN
    expect(objectifCréé).toStrictEqual({
      contenu,
      auteur,
      date,
    });
  });
});
